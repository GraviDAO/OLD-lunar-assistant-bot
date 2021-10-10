import { Client } from "discord.js";
import db from "../services/admin";
import { getTokensOfOwner } from "./getTokensOfOwner";

// const userDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>

export const coldUpdateDiscordRolesForUser = async (
  client: Client,
  userID: string,
  userDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
) => {
  // get the users wallet address
  const walletAddress = (userDoc.data() as User).wallet;

  // mapping from discord server name to a list of active roles
  const activeRoles: { [guildName: string]: string[] } = {};
  // mapping from discord server name to a list of roles being removed
  const removedRoles: { [guildName: string]: string[] } = {};

  // userTokens cache
  const userTokens: { [nftAddress: string]: string[] } = {};

  // loop through guilds registered with lunar assistant
  await Promise.all(
    guildConfigsSnapshot.docs.map(async (doc) => {
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
          const newRole = guild.roles.cache.find(
            (role) => role.name == rule.roleName
          );

          if (!newRole) return;

          // check if this user satisfies the rule
          const tokens = userTokens[guild.name]
            ? userTokens[guild.name]
            : ((userTokens[guild.name] = (
                await getTokensOfOwner(walletAddress, rule.nftAddress)
              ).tokens),
              userTokens[guild.name]);

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

            // update activeRoles
            if (activeRoles[guild.name]) {
              activeRoles[guild.name].push(newRole.name);
            } else {
              activeRoles[guild.name] = [newRole.name];
            }
            // add the role to the member
            member.roles.add(newRole);
          } else if (
            member.roles.cache.some((role) => role.name === newRole.name)
          ) {
            // the user doesn't match the role rules but has the role anyways
            // update accordingly

            // update removedRoles
            if (removedRoles[guild.name]) {
              removedRoles[guild.name].push(newRole.name);
            } else {
              removedRoles[guild.name] = [newRole.name];
            }
            // remove the role from the member
            member.roles.remove(newRole);
          }
        })
      );
    })
  );

  // update the user's active roles
  // db.collection("users").doc(userID).update({
  //   activeRoles,
  // });

  // return the list of the users active roles and removed roles
  return { activeRoles, removedRoles };
};

export const updateDiscordRolesForUser = async (
  client: Client,
  userID: string
) => {
  // get the user document
  const userDoc = await db.collection("users").doc(userID).get();

  // check that the user document exists
  if (!userDoc.exists) throw new Error("Couldn't find user document");

  // get guilds from db
  // later store this in memory for performance reasons
  const guildConfigsSnapshot = await db.collection("guildConfigs").get();

  if (guildConfigsSnapshot.empty)
    throw new Error("Couldn't find any guild configs");

  coldUpdateDiscordRolesForUser(client, userID, userDoc, guildConfigsSnapshot);
};
