import { Guild, GuildMember } from "discord.js";
import { LunarAssistant } from "../index";
import {
  CW20Rule,
  GuildConfig,
  GuildRule,
  NFTRule,
  SimpleRule,
  Users,
} from "../shared/firestoreTypes";
import { UpdateUserDiscordRolesResponse } from "../types";
import { getRelevantContractAddresses } from "./getRelevantContractAddresses";
import { getWalletsContents } from "./getWalletContents";
import { guildRuleToSimpleRule, isNFTRule } from "./guildRuleHelpers";

export async function coldUpdateDiscordRolesForUser(
  this: LunarAssistant,
  userID: string,
  walletAddresses: string[],
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): Promise<UpdateUserDiscordRolesResponse> {
  // Get the user document
  const users = (
    await this.db.collection("root").doc("users").get()
  ).data() as Users;

  // mapping from discord server name to a list of active roles
  const activeRoles: { [guildName: string]: string[] } = {};

  // mapping from discord server name to a list of roles being removed
  const removedRoles: { [guildName: string]: string[] } = {};

  const relevantContractAddresses =
    getRelevantContractAddresses(guildConfigsSnapshot);

  const userTokensCache = users.discordIds.includes(userID)
    ? await getWalletsContents(walletAddresses, relevantContractAddresses)
    : { nft: {}, cw20: {} };

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

        try {
          const tokens = userTokensCache.nft[nftRule.nftAddress].tokenIds;

          // get the number of matching tokens
          numMatchingTokens = (
            nftRule.tokenIds != undefined
              ? tokens.filter(
                  (token) =>
                    nftRule.tokenIds && nftRule.tokenIds.includes(token)
                )
              : tokens
          ).length;
        } catch (e) {
          numMatchingTokens = 0;
        }
      } else {
        const cw20Rule = rule as CW20Rule;

        try {
          const numTokens = userTokensCache.cw20[cw20Rule.cw20Address].quantity;

          numMatchingTokens = numTokens;
        } catch (e) {
          numMatchingTokens = 0;
        }
      }

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

    return p.then(async () => {
      try {
        const member = await guild.members.fetch(userID);

        coldUpdateDiscordRolesForUserInGuild(guild, member, guildConfigDoc);
      } catch (e) {
        // member doesn't exist in guild
      }
    });
  }, new Promise((resolve, reject) => resolve(null)));

  console.log(
    `Got all tokens and updated roles for ${walletAddresses.join(",")}:`,
    {
      activeRoles,
      removedRoles,
    }
  );

  // return the list of the users active roles and removed roles
  return { activeRoles, removedRoles };
}
