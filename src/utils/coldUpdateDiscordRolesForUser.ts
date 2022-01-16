import { Guild, GuildMember } from "discord.js";
import { LunarAssistant } from "../index";
import {
  CW20Rule,
  GuildConfig,
  GuildRule,
  NFTRule,
  SimpleRule,
  User,
} from "../shared/firestoreTypes";
import { UpdateUserDiscordRolesResponse } from "../types";
import { getRelevantContractAddresses } from "./getRelevantContractAddresses";
import { getWalletContents } from "./getWalletContents";
import { guildRuleToSimpleRule, isNFTRule } from "./guildRuleHelpers";

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

  const userTokensCache = await getWalletContents(
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

      let rule: SimpleRule;
      try {
        rule = guildRuleToSimpleRule(guildRule);
      } catch (err) {
        return;
      }

      // get the discord role from the discord client
      const newRole = guild.roles.cache.find(
        (role) => role.name == rule.roleName
      );

      if (!newRole) return;

      // set numMatchingTokens
      let numMatchingTokens: number;
      if (isNFTRule(rule)) {
        const nftRule = rule as NFTRule;

        const tokens = userTokensCache.nft[nftRule.nftAddress].tokenIds;

        // get the number of matching tokens
        numMatchingTokens = (
          nftRule.tokenIds != undefined
            ? tokens.filter(
                (token) => nftRule.tokenIds && nftRule.tokenIds.includes(token)
              )
            : tokens
        ).length;
      } else {
        const cw20Rule = rule as CW20Rule;

        const numTokens = userTokensCache.cw20[cw20Rule.cw20Address].quantity;

        numMatchingTokens = numTokens;
      }

      // How to deal with multiple roles that have the same name?

      if (
        numMatchingTokens >= rule.quantity &&
        // don't duplicate role if it was already granted
        !(
          activeRoles[guild.name] &&
          activeRoles[guild.name].includes(newRole.name)
        )
      ) {
        // the user matches the role rules, update accordingly

        // update activeRoles
        if (activeRoles[guild.name]) {
          activeRoles[guild.name].push(newRole.name);
        } else {
          activeRoles[guild.name] = [newRole.name];
        }

        // if removedRoles includes the role, delete it
        if (
          removedRoles[guild.name] &&
          removedRoles[guild.name].includes(newRole.name)
        ) {
          removedRoles[guild.name].splice(
            removedRoles[guild.name].indexOf(newRole.name)
          );
        }
      } else if (
        // make sure member exists
        member &&
        // make sure member has role
        member.roles.cache.some((role) => role.name === newRole.name) &&
        // make sure member wasn't granted the role
        !(
          activeRoles[guild.name] &&
          activeRoles[guild.name].includes(newRole.name)
        )
      ) {
        // the user doesn't match the role rules but has the role anyways
        // update accordingly

        // update removedRoles
        if (removedRoles[guild.name]) {
          removedRoles[guild.name].push(newRole.name);
        } else {
          removedRoles[guild.name] = [newRole.name];
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

    return p.then(async () => {
      try {
        const member = await guild.members.fetch(userID);

        // if not a member then skip
        if (!member) return;

        await coldUpdateDiscordRolesForUserInGuild(
          guild,
          member,
          guildConfigDoc
        );

        // add the relevant roles
        await Promise.all(
          activeRoles[guild.name].map(async (roleName) => {
            // get the discord role from the discord client
            const newRole = guild.roles.cache.find(
              (role) => role.name == roleName
            );

            if (!newRole) return;

            try {
              // add the role to the member
              await member.roles.add(newRole);
            } catch (e) {
              console.error(
                "Couldn't add role, probably because of role hierarchy.",
                guild.name,
                newRole.name
              );
            }
          })
        );

        // remove the relevant roles
        await Promise.all(
          removedRoles[guild.name].map(async (roleName) => {
            // get the discord role from the discord client
            const newRole = guild.roles.cache.find(
              (role) => role.name == roleName
            );

            if (!newRole) return;

            try {
              // remove the role from the member
              await member.roles.remove(newRole);
            } catch (e) {
              console.error(
                "Couldn't remove role, probably because of role hierarchy.",
                guild.name,
                newRole.name
              );
            }
          })
        );
      } catch (e) {
        // member doesn't exist in guild
      }
    });
  }, new Promise((resolve, reject) => resolve(null)));

  console.log(`Got all tokens and updated roles for ${walletAddress}:`, {
    activeRoles,
    removedRoles,
  });

  // return the list of the users active roles and removed roles
  return { activeRoles, removedRoles };
}
