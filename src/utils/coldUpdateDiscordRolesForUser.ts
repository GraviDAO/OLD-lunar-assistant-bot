import { Guild, GuildMember } from "discord.js";
import { LunarAssistant } from "../index";
import {
  GuildConfig,
  GuildRule,
  NFTRule,
  User,
} from "../shared/firestoreTypes";
import { UpdateUserDiscordRolesResponse } from "../types";
import { getAllTokensOfOwner } from "./getAllTokensOfOwner";
import { getRelevantContractAddresses } from "./getRelevantContractAddresses";
import { guildRuleToNFTRule } from "./guildRuleToNFTRule";

export async function coldUpdateDiscordRolesForUser(
  this: LunarAssistant,
  userID: string,
  userDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): Promise<UpdateUserDiscordRolesResponse> {
  // get the users wallet address
  const walletAddress = (userDoc.data() as User).wallet;

  // mapping from discord server name to a list of active roles
  const activeRoles: { [guildName: string]: string[] } = {};

  // mapping from discord server name to a list of roles being removed
  const removedRoles: { [guildName: string]: string[] } = {};

  const relevantContractAddresses =
    getRelevantContractAddresses(guildConfigsSnapshot);

  const userTokensCache = await getAllTokensOfOwner(
    walletAddress,
    relevantContractAddresses
  );

  // update roles for user in guild
  const coldUpdateDiscordRolesForUserInGuild = async (
    guild: Guild,
    member: GuildMember | undefined,
    guildConfigDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
  ) => {
    // update roles for user in guild according to a specific rule
    const coldUpdateDiscordRolesForUserInGuildRule = async (
      guildRule: GuildRule
    ) => {
      // for now we are only handling a single nft rule
      // build the single NFT rule

      let rule: NFTRule;
      try {
        rule = guildRuleToNFTRule(guildRule);
      } catch (err) {
        return;
      }

      // get the discord role from the discord client
      const newRole = guild.roles.cache.find(
        (role) => role.name == rule.roleName
      );

      if (!newRole) return;

      // check if this user satisfies the rule
      const tokens = userTokensCache[rule.nftAddress];

      // get the number of matching tokens
      const numMatchingTokens = (
        rule.tokenIds != undefined
          ? tokens.filter(
              (token) => rule.tokenIds && rule.tokenIds.includes(token)
            )
          : tokens
      ).length;

      if (numMatchingTokens >= rule.quantity) {
        // the user matches the role rules, update accordingly

        try {
          // update activeRoles
          if (activeRoles[guild.name]) {
            activeRoles[guild.name].push(newRole.name);
          } else {
            activeRoles[guild.name] = [newRole.name];
          }

          if (member) {
            // add the role to the member
            await member.roles.add(newRole);
          }
        } catch (e) {
          console.error(
            "Couldn't add role, probably because of role hierarchy.",
            guild.name,
            newRole.name
          );
        }
      } else if (
        member &&
        member.roles.cache.some((role) => role.name === newRole.name)
      ) {
        // the user doesn't match the role rules but has the role anyways
        // update accordingly

        try {
          // update removedRoles
          if (removedRoles[guild.name]) {
            removedRoles[guild.name].push(newRole.name);
          } else {
            removedRoles[guild.name] = [newRole.name];
          }

          // remove the role from the member
          await member.roles.remove(newRole);
        } catch (e) {
          console.error(
            "Couldn't remove role, probably because of role hierarchy.",
            guild.name,
            newRole.name
          );
        }
      }
    };

    // loop through each of the rules registered with the guild in sequence
    await (guildConfigDoc.data() as GuildConfig).rules.reduce(
      (p, guildRule) => {
        return p.then(() =>
          coldUpdateDiscordRolesForUserInGuildRule(guildRule)
        );
      },
      new Promise((resolve) => resolve(null))
    );
  };

  // loop through guilds registered with lunar assistant in sequence
  await guildConfigsSnapshot.docs.reduce((p, guildConfigDoc) => {
    // get the guild from the discord client
    const guild = this.client.guilds.cache.get(guildConfigDoc.id);

    if (!guild) return p.then(() => new Promise((resolve) => resolve(null)));

    // get the member from the discord client
    const member = guild.members.cache.get(userID);

    // if (!member) return p.then(() => new Promise((resolve) => resolve(null)));

    return p.then(() =>
      coldUpdateDiscordRolesForUserInGuild(guild, member, guildConfigDoc)
    );
  }, new Promise((resolve, reject) => resolve(null)));

  console.log(`Got all tokens and updated roles for ${walletAddress}:`, {
    activeRoles,
    removedRoles,
  });

  // return the list of the users active roles and removed roles
  return { activeRoles, removedRoles };
}
