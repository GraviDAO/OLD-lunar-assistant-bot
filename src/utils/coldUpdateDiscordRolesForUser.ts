import { LunarAssistant } from "../index";
import { GuildConfig, User } from "../shared/firestoreTypes";
import { UpdateUserDiscordRolesResponse } from "../types";
import { checkRulesQualifies } from "./checkRuleQualifies";
import { getRelevantContractAddresses } from "./getRelevantContractAddresses";
import { getWalletContents } from "./getWalletContents";

export async function coldUpdateDiscordRolesForUser(
  this: LunarAssistant,
  userID: string,
  userDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): Promise<UpdateUserDiscordRolesResponse> {
  // Get the users wallet address
  const walletAddress = (userDoc.data() as User).wallet;

  const { addedRoles, persistedRoles, removedRoles } =
    await getAddedPersistedRemovedRoleIds(
      this,
      userID,
      userDoc,
      guildConfigsSnapshot
    );

  const { addedRoleNames, persistedRoleNames, removedRoleNames } =
    await propogateRoleUpdates(
      this,
      userID,
      guildConfigsSnapshot,
      addedRoles,
      persistedRoles,
      removedRoles
    );

  console.log(`Got all tokens and updated roles for ${walletAddress}:`, {
    addedRoles: addedRoleNames,
    persistedRoles: persistedRoleNames,
    removedRoles: removedRoleNames,
  });

  // Return the list of the users active roles and removed roles
  return {
    addedRoleNames: addedRoleNames,
    persistedRoleNames: persistedRoleNames,
    removedRoleNames: removedRoleNames,
  };
}

const getAddedPersistedRemovedRoleIds = async (
  lunar: LunarAssistant,
  userID: string,
  userDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
) => {
  // Get the users wallet address
  const walletAddress = (userDoc.data() as User).wallet;

  const relevantContractAddresses =
    getRelevantContractAddresses(guildConfigsSnapshot);

  const userTokensCache = await getWalletContents(
    walletAddress,
    relevantContractAddresses
  );

  // Mapping from discord server id to a list of added role ids
  const addedRoles: { [guildId: string]: string[] } = {};

  // Mapping from discord server id to a list of persisted role ids
  const persistedRoles: { [guildId: string]: string[] } = {};

  // Mapping from discord server id to a list of removed role ids
  const removedRoles: { [guildId: string]: string[] } = {};

  for (const guildConfigDoc of guildConfigsSnapshot.docs) {
    // Get the guild from the discord client
    const guild = lunar.client.guilds.cache.get(guildConfigDoc.id);
    if (!guild) continue;

    // Get the member from the guild
    const member = await guild.members.fetch(userID);
    if (!member) continue;

    // Get the guild rules
    const guildRules = (guildConfigDoc.data() as GuildConfig).rules;

    // Iterate over the guild rules
    for (const guildRule of guildRules) {
      // Get the role corresponding to the guildRule
      const newRole = guild.roles.cache.find(
        (role) => role.id == guildRule.roleId
      );

      // If rule doesn't exist, skip
      if (!newRole) {
        console.error(`No role with that id: ${guildRule.roleId}`);
        continue;
      }

      // Get ruleQualifies and hasRole
      let ruleQualifies: boolean = await checkRulesQualifies(
        guildRule,
        userTokensCache,
        walletAddress
      );

      const hasRole = // Check if member exists and has the role
        // TODO member should always exist
        (member && member.roles.cache.some((role) => role.id === newRole.id)) ||
        false;

      // Propogate the information to addedRoles, persistedRoles, and removedRoles
      updateActivePersistedRemovedRoles(
        guild.id,
        newRole.id,
        ruleQualifies,
        hasRole,
        addedRoles,
        persistedRoles,
        removedRoles
      );
    }
  }
  return { addedRoles, persistedRoles, removedRoles };
};

const propogateRoleUpdates = async (
  lunar: LunarAssistant,
  userID: string,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>,
  addedRoles: { [guildId: string]: string[] },
  persistedRoles: { [guildId: string]: string[] },
  removedRoles: { [guildId: string]: string[] }
) => {
  // Mapping from discord server name to a list of added role names
  const addedRoleNames: { [guildId: string]: string[] } = {};

  // Mapping from discord server name to a list of persisted role names
  const persistedRoleNames: { [guildId: string]: string[] } = {};

  // Mapping from discord server name to a list of removed roles names
  const removedRoleNames: { [guildId: string]: string[] } = {};

  for (const guildConfigDoc of guildConfigsSnapshot.docs) {
    // Get the guild from the discord client
    const guild = lunar.client.guilds.cache.get(guildConfigDoc.id);
    if (!guild) continue;

    // Get the member from the guild
    const member = await guild.members.fetch(userID);
    if (!member) continue;

    const guildId = guildConfigDoc.id;

    const uniqueAddedRoles = [...new Set(addedRoles[guildId])];
    const uniquePersistedRoles = [...new Set(persistedRoles[guildId])];
    const uniqueRemovedRoles = [...new Set(removedRoles[guildId])].filter((x) =>
      uniquePersistedRoles.includes(x)
    );

    for (const roleId of uniqueAddedRoles || []) {
      const newRole = guild.roles.cache.find((role) => role.id == roleId);

      if (!newRole) {
        console.error("This shouldn't happen. Role missing to add.");
        continue;
      }

      try {
        // Add the role to the member
        await member.roles.add(newRole);

        // Add the role to activeRolesNames
        if (addedRoleNames[guild.name]) {
          addedRoleNames[guild.name].push(newRole.name);
        } else {
          addedRoleNames[guild.name] = [newRole.name];
        }
      } catch (e) {
        console.error(
          "Couldn't add role, probably because of role hierarchy.",
          guild.name,
          newRole.id
        );
      }
    }

    for (const roleId of uniquePersistedRoles || []) {
      const newRole = guild.roles.cache.find((role) => role.id == roleId);

      if (!newRole) {
        console.error("This shouldn't happen. Role missing to add.");
        continue;
      }

      // Add the role to activeRolesNames
      if (persistedRoleNames[guild.name]) {
        persistedRoleNames[guild.name].push(newRole.name);
      } else {
        persistedRoleNames[guild.name] = [newRole.name];
      }
    }

    for (const roleId of uniqueRemovedRoles || []) {
      const newRole = guild.roles.cache.find((role) => role.id == roleId);

      if (!newRole) {
        console.error("This shouldn't happen. Role missing to add.");
        continue;
      }

      try {
        // Add the role to the member
        await member.roles.remove(newRole);

        // Add the role to activeRolesNames
        if (removedRoleNames[guild.name]) {
          removedRoleNames[guild.name].push(newRole.name);
        } else {
          removedRoleNames[guild.name] = [newRole.name];
        }
      } catch (e) {
        console.error(
          "Couldn't remove role, probably because of role hierarchy.",
          guild.name,
          newRole.id
        );
      }
    }
  }

  // Return the list of the users active roles and removed roles
  return {
    addedRoleNames: addedRoleNames,
    persistedRoleNames: persistedRoleNames,
    removedRoleNames: removedRoleNames,
  };
};
