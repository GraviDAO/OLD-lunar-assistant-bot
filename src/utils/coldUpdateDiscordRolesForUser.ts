import { GuildMember } from "discord.js";
import { LunarAssistant } from "../index";
import { GuildConfig, User } from "../shared/firestoreTypes";
import { UpdateUserDiscordRolesResponse } from "../types";
import { checkRulesQualifies } from "./checkRuleQualifies";
import { getRelevantContractAddresses } from "./getRelevantContractAddresses";
import { getWalletContents } from "./getWalletContents";
import { updateActivePersistedRemovedRoles } from "./updateActiveRemovedRoles";

export async function coldUpdateDiscordRolesForUser(
  this: LunarAssistant,
  userID: string,
  userDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): Promise<UpdateUserDiscordRolesResponse> {
  // Get the users wallet address
  const walletAddress = (userDoc.data() as User).wallet;

  const benchmark = {
    functions: {
      getAddedPersistedRemovedRoleIds: {
        start: 0,
        end: 0,
        diff: 0,
      },
      propogateRoleUpdates: {
        start: 0,
        end: 0,
        diff: 0,
      },
    },
  };

  benchmark.functions.getAddedPersistedRemovedRoleIds.start = Date.now();

  const { addedRoles, persistedRoles, removedRoles } =
    await getAddedPersistedRemovedRoleIds(
      this,
      userID,
      userDoc,
      guildConfigsSnapshot
    );

  benchmark.functions.getAddedPersistedRemovedRoleIds.end = Date.now();
  benchmark.functions.getAddedPersistedRemovedRoleIds.diff =
    benchmark.functions.getAddedPersistedRemovedRoleIds.end -
    benchmark.functions.getAddedPersistedRemovedRoleIds.start;

  benchmark.functions.propogateRoleUpdates.start = Date.now();

  const { addedRoleNames, persistedRoleNames, removedRoleNames } =
    await propogateRoleUpdates(
      this,
      userID,
      guildConfigsSnapshot,
      addedRoles,
      persistedRoles,
      removedRoles
    );

  benchmark.functions.propogateRoleUpdates.end = Date.now();
  benchmark.functions.propogateRoleUpdates.diff =
    benchmark.functions.propogateRoleUpdates.end -
    benchmark.functions.propogateRoleUpdates.start;

  console.log(benchmark);

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

export const getAddedPersistedRemovedRoleIds = async (
  lunar: LunarAssistant,
  userID: string,
  userDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
) => {
  // Get the users wallet address
  const walletAddress = (userDoc.data() as User).wallet;

  const relevantContractAddresses =
    getRelevantContractAddresses(guildConfigsSnapshot);

  const prefetchWallet = Date.now();
  const userTokensCache = await getWalletContents(
    walletAddress,
    relevantContractAddresses,
    lunar.db,
  );
  // console.log(`Time to get wallet contents: ${Date.now() - prefetchWallet}`);

  // Mapping from discord server id to a list of added role ids
  const addedRoles: { [guildId: string]: string[] } = {};

  // Mapping from discord server id to a list of persisted role ids
  const persistedRoles: { [guildId: string]: string[] } = {};

  // Mapping from discord server id to a list of removed role ids
  const removedRoles: { [guildId: string]: string[] } = {};

  for (const guildConfigDoc of guildConfigsSnapshot.docs) {
    // If lunar is null than we want to query across all guilds
    // Get the guild from the discord client
    const guild = lunar.client.guilds.cache.get(guildConfigDoc.id);
    if (!guild) continue;

    const prefetch = Date.now();

    // Get the member from the guild
    let member: GuildMember;
    try {
      member = await guild.members.fetch(userID);
      if (!member) continue;
    } catch (e) {
      // Member doesn't exist in guild
      continue;
    }

    // console.log(`Time to fetch member: ${Date.now() - prefetch}`);

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

export const propogateRoleUpdates = async (
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
    let member: GuildMember;

    try {
      member = await guild.members.fetch(userID);
      if (!member) continue;
    } catch (e) {
      // Member doesn't exist in guild
      continue;
    }

    const guildId = guildConfigDoc.id;

    const uniqueAddedRoles = [...new Set(addedRoles[guildId])];
    const uniquePersistedRoles = [...new Set(persistedRoles[guildId])];
    const uniqueRemovedRoles = [...new Set(removedRoles[guildId])].filter((x) =>
      uniquePersistedRoles.includes(x)
    );

    const roleIdToRoleName = (roleId: string) => {
      const newRole = guild.roles.cache.find((role) => role.id == roleId);

      if (!newRole) {
        console.error("This shouldn't happen. Role missing to add.");
      }

      return newRole?.name || "Undefined";
    };

    addedRoleNames[guild.name] = uniqueAddedRoles.map(roleIdToRoleName);
    persistedRoleNames[guild.name] = uniquePersistedRoles.map(roleIdToRoleName);
    removedRoleNames[guild.name] = uniqueRemovedRoles.map(roleIdToRoleName);

    if (uniqueAddedRoles.length > 0) {
      try {
        await member.roles.add(uniqueAddedRoles);
      } catch (e) {
        console.error(
          "Couldn't add role, probably because of role hierarchy.",
          guild.name,
          uniqueAddedRoles,
          addedRoleNames[guild.name]
        );
      }
    }

    if (uniqueRemovedRoles.length > 0) {
      try {
        await member.roles.remove(uniqueRemovedRoles);
      } catch (e) {
        console.error(
          "Couldn't remove role, probably because of role hierarchy.",
          guild.name,
          uniqueRemovedRoles,
          removedRoleNames[guild.name]
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
