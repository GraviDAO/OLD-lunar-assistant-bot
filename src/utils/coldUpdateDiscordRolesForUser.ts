import { Guild, GuildMember } from "discord.js";
import { environment } from "../../config.json";
import { LunarAssistant } from "../index";
import { UpdateUserDiscordRolesResponse, UserTokens } from "../types";
import { getRandomEarthTokens } from "./getRandomEarthTokens";
import { getTokensOfOwner } from "./getTokensOfOwner";

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

  const randomEarthUserTokens =
    environment === "production"
      ? await getRandomEarthTokens(walletAddress)
      : null;

  const userTokensCache: UserTokens = {};

  // update roles for user in guild
  const coldUpdateDiscordRolesForUserInGuild = async (
    guild: Guild,
    member: GuildMember,
    guildConfigDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
  ) => {
    // update roles for user in guild according to a specific rule
    const coldUpdateDiscordRolesForUserInGuildRule = async (
      guildRule: GuildRule
    ) => {
      // for now we are only handling a single nft rule
      // build the single NFT rule
      const nftAddresses = Object.keys(guildRule.nft);
      if (nftAddresses.length !== 1) return;
      const nftAddress = nftAddresses[0];
      const rule: NFTRule = {
        nftAddress,
        tokenIds: guildRule.nft[nftAddress].tokenIds,
        quantity: guildRule.nft[nftAddress].quantity,
        roleName: guildRule.roleName,
      };

      // get the discord role from the discord client
      const newRole = guild.roles.cache.find(
        (role) => role.name == rule.roleName
      );

      if (!newRole) return;

      // check if this user satisfies the rule
      const tokens =
        environment === "production"
          ? randomEarthUserTokens![rule.nftAddress]
            ? randomEarthUserTokens![rule.nftAddress]
            : []
          : userTokensCache[rule.nftAddress]
          ? userTokensCache[rule.nftAddress]
          : ((userTokensCache[rule.nftAddress] = (
              await getTokensOfOwner(walletAddress, rule.nftAddress)
            ).tokens),
            userTokensCache[rule.nftAddress]);

      // get the number of matching tokens
      const numMatchingTokens = (
        rule.tokenIds != undefined
          ? tokens.filter(
              (token) => rule.tokenIds && rule.tokenIds.includes(token)
            )
          : tokens
      ).length;

      if (numMatchingTokens > rule.quantity) {
        // the user matches the role rules, update accordingly

        try {
          // update activeRoles
          if (activeRoles[guild.name]) {
            activeRoles[guild.name].push(newRole.name);
          } else {
            activeRoles[guild.name] = [newRole.name];
          }

          // add the role to the member
          await member.roles.add(newRole);
        } catch (e) {
          console.error(
            "Couldn't add role, probably because of role hierarchy."
          );
        }
      } else if (
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
            "Couldn't remove role, probably because of role hierarchy."
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

    if (!guild) return new Promise((resolve) => resolve(null));

    // get the member from the discord client
    const member = guild.members.cache.get(userID);

    if (!member) return new Promise((resolve) => resolve(null));

    return p.then(() =>
      coldUpdateDiscordRolesForUserInGuild(guild, member, guildConfigDoc)
    );
  }, new Promise((resolve, reject) => resolve(null)));

  // return the list of the users active roles and removed roles
  return { activeRoles, removedRoles };
}
