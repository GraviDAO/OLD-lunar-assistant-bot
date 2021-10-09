import { Client } from "discord.js";
import db from "../services/admin";
import { getTokensOfOwner } from "./getTokensOfOwner";

export const updateDiscordRolesForUser = async (
  client: Client,
  userID: string
) => {
  // mapping from discord server name to a list of active roles
  const activeRoles: { [guildName: string]: string[] } = {};
  // mapping from discord server name to a list of roles being removed
  const removedRoles: { [guildName: string]: string[] } = {};

  // get the user document
  const userDoc = await db.collection("users").doc(userID).get();

  // check that the user document exists
  if (!userDoc.exists) throw new Error("Couldn't find user document");

  // get the users wallet address
  const walletAddress = (userDoc.data() as User).wallet;

  // get guilds from db
  // later store this in memory for performance reasons
  const guildSnapshot = await db.collection("guildConfigs").get();

  // loop through guilds registered with lunar assistant
  await Promise.all(
    guildSnapshot.docs.map(async (doc) => {
      // get the guild from the discord client
      const guild = client.guilds.cache.get(doc.id);

      if (!guild) return;

      // get the member from the discord client
      const member = guild.members.cache.get(userID);

      if (!member) return;

      // loop through each of the rules registered with the guild
      await Promise.all(
        (doc.data() as GuildConfig).rules.map(async (guildRule) => {
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
          const role = guild.roles.cache.find(
            (role) => role.name == rule.roleName
          );

          if (!role) return;

          // check if this user satisfies the rule
          const tokens = (
            await getTokensOfOwner(walletAddress, rule.nftAddress)
          ).tokens;

          // get the number of matching tokens
          const numMatchingTokens = (
            rule.tokenIds != undefined
              ? tokens.filter(
                  (token) => rule.tokenIds && rule.tokenIds.includes(token)
                )
              : tokens
          ).length;

          if (numMatchingTokens > rule.quantity) {
            // update activeRoles
            if (activeRoles[guild.name]) {
              activeRoles[guild.name].push(role.name);
            } else {
              activeRoles[guild.name] = [role.name];
            }
            // add the role to the member
            member.roles.add(role);
          } else {
            // update removedRoles
            if (removedRoles[guild.name]) {
              removedRoles[guild.name].push(role.name);
            } else {
              removedRoles[guild.name] = [role.name];
            }
            // remove the role from the member
            member.roles.remove(role);
          }
        })
      );
    })
  );
  // return the list of roles the user is eligible for
  return { activeRoles, removedRoles };
};
