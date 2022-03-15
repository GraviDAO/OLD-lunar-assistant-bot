import { Guild, GuildMember } from "discord.js";
import { LunarAssistant } from "../index";
import {
  APIRule,
  CW20Rule,
  GuildConfig,
  GuildRule,
  NFTRule,
  SimpleRule,
  User,
} from "../shared/firestoreTypes";
import { UpdateUserDiscordRolesResponse } from "../types";
import { getCustomAPIWalletAllowed } from "./getCustomAPIWalletAllowed";
import { getRelevantContractAddresses } from "./getRelevantContractAddresses";
import { getWalletContents } from "./getWalletContents";
import {
  guildRuleToSimpleRule,
  isApiRule,
  isNFTRule,
} from "./guildRuleHelpers";

export async function coldUpdateDiscordRolesForUser(
  this: LunarAssistant,
  userID: string,
  userDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): Promise<UpdateUserDiscordRolesResponse> {
  // Get the users wallet address
  const walletAddress = (userDoc.data() as User).wallet;

  // Mapping from discord server id to a list of active role ids
  const activeRoles: { [guildName: string]: string[] } = {};

  // Mapping from discord server id to a list of role ids being removed
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
        console.error(
          `Couldn't convert to simple rule: ${JSON.stringify(guildRule)}`
        );
        return;
      }

      // get the discord role from the discord client
      const newRole = guild.roles.cache.find((role) => role.id == rule.roleId);

      if (!newRole) {
        console.error(`No role with that name: ${rule.roleId}`);
        return;
      }

      // set numMatchingTokens
      let numMatchingTokens: number;
      let customApiAllowed: boolean;
      let quantity: number;
      if (isNFTRule(rule)) {
        const nftRule = rule as NFTRule;
        quantity = nftRule.quantity;
        customApiAllowed = false;

        const tokens = userTokensCache.nft[nftRule.nftAddress]?.tokenIds || [];

        // get the number of matching tokens
        numMatchingTokens = (
          nftRule.tokenIds != undefined
            ? tokens.filter(
                (token) => nftRule.tokenIds && nftRule.tokenIds.includes(token)
              )
            : tokens
        ).length;
      } else if (isApiRule(rule)) {
        const apiRule = rule as APIRule;
        customApiAllowed = await getCustomAPIWalletAllowed(
          apiRule.apiUrl,
          walletAddress
        );
        numMatchingTokens = 0;
        quantity = Number.MAX_SAFE_INTEGER; //not used for apiRule
      } else {
        const cw20Rule = rule as CW20Rule;
        quantity = cw20Rule.quantity;

        const numTokens =
          userTokensCache.cw20[cw20Rule.cw20Address]?.quantity || 0;

        numMatchingTokens = numTokens;
        customApiAllowed = false;
      }

      // How to deal with multiple roles that have the same name?

      if (
        (numMatchingTokens >= quantity || customApiAllowed) &&
        // don't duplicate role if it was already granted
        !(activeRoles[guild.id] && activeRoles[guild.id].includes(newRole.id))
      ) {
        // the user matches the role rules, update accordingly

        // update activeRoles
        if (activeRoles[guild.id]) {
          activeRoles[guild.id].push(newRole.id);
        } else {
          activeRoles[guild.id] = [newRole.id];
        }

        // if removedRoles includes the role, delete it
        if (
          removedRoles[guild.id] &&
          removedRoles[guild.id].includes(newRole.id)
        ) {
          removedRoles[guild.id].splice(
            removedRoles[guild.id].indexOf(newRole.id)
          );
        }
      } else if (
        // Make sure member exists
        member &&
        // Make sure member has role
        member.roles.cache.some((role) => role.id === newRole.id) &&
        // Make sure member wasn't granted the role
        !(activeRoles[guild.id] && activeRoles[guild.id].includes(newRole.id))
      ) {
        // the user doesn't match the role rules but has the role anyways
        // update accordingly

        // update removedRoles
        if (removedRoles[guild.id]) {
          removedRoles[guild.id].push(newRole.id);
        } else {
          removedRoles[guild.id] = [newRole.id];
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

  // Mapping from discord server name to a list of active role names
  const activeRolesNames: { [guildName: string]: string[] } = {};

  // Mapping from discord server name to a list of roles names being removed
  const removedRolesNames: { [guildName: string]: string[] } = {};

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
          activeRoles[guild.id].map(async (roleId) => {
            // Get the discord role from the discord client
            const newRole = guild.roles.cache.find((role) => role.id == roleId);

            if (!newRole) {
              console.error("This shouldn't happen. Role missing to add.");
              return;
            }

            try {
              // Add the role to the member
              await member.roles.add(newRole);

              // Add the role to activeRolesNames
              if (activeRolesNames[guild.name]) {
                activeRolesNames[guild.name].push(newRole.name);
              } else {
                activeRolesNames[guild.name] = [newRole.name];
              }
            } catch (e) {
              console.error(
                "Couldn't add role, probably because of role hierarchy.",
                guild.name,
                newRole.id
              );
            }
          })
        );

        // remove the relevant roles
        await Promise.all(
          removedRoles[guild.id].map(async (roleId) => {
            // get the discord role from the discord client
            const newRole = guild.roles.cache.find((role) => role.id == roleId);

            if (!newRole) {
              console.error("This shouldn't happen. Role missing to remove.");
              return;
            }

            try {
              // Remove the role from the member
              await member.roles.remove(newRole);

              // Add the role to removedRolesNames
              if (removedRolesNames[guild.name]) {
                removedRolesNames[guild.name].push(newRole.name);
              } else {
                removedRolesNames[guild.name] = [newRole.name];
              }
            } catch (e) {
              console.error(
                "Couldn't remove role, probably because of role hierarchy.",
                guild.name,
                newRole.id
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
    activeRoles: activeRolesNames,
    removedRoles: removedRolesNames,
  });

  // return the list of the users active roles and removed roles
  return { activeRoles: activeRolesNames, removedRoles: removedRolesNames };
}
