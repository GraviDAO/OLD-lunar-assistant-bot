import { GuildConfig } from "../shared/firestoreTypes";
import { checkRulesQualifies } from "./checkRuleQualifies";
import { getContractAddressesRelevantToGuildConfig } from "./getRelevantContractAddresses";
import { getWalletContents } from "./getWalletContents";

export const testGetActiveInactiveRoleIdsForGuildConfigDoc = async (
  walletAddress: string,
  // guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>,
  db: FirebaseFirestore.Firestore,
  guildConfigDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
) => {
  const guildConfig = guildConfigDoc.data() as GuildConfig;
  const relevantContractAddresses =
    getContractAddressesRelevantToGuildConfig(guildConfig);

  const userTokensCache = await getWalletContents(
    walletAddress,
    relevantContractAddresses,
  );

  // Mapping from discord server id to a list of active role ids
  const activeRoles: { [guildId: string]: string[] } = {};

  // Mapping from discord server id to a list of inactive role ids
  const inactiveRoles: { [guildId: string]: string[] } = {};

  const updateActivePersistedRemovedRolesForGuildConfigDoc = async (
    guildConfigDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
  ) => {
    // If lunar is null than we want to query across all guilds
    // Get the guild from the discord client

    const guildId = guildConfigDoc.id;

    // Get the guild rules
    const guildRules = (guildConfigDoc.data() as GuildConfig).rules;

    // Iterate over the guild rules
    for (const guildRule of guildRules) {
      // Get the role corresponding to the guildRule

      // Get ruleQualifies and hasRole
      let roleActive: boolean = await checkRulesQualifies(
        guildRule,
        userTokensCache,
        walletAddress
      );

      if (roleActive) {
        if (activeRoles[guildId]) {
          activeRoles[guildId].push(guildRule.roleId);
        } else {
          activeRoles[guildId] = [guildRule.roleId];
        }
      } else {
        if (inactiveRoles[guildId]) {
          inactiveRoles[guildId].push(guildRule.roleId);
        } else {
          inactiveRoles[guildId] = [guildRule.roleId];
        }
      }
    }
  };

  await updateActivePersistedRemovedRolesForGuildConfigDoc(guildConfigDoc);

  return { activeRoles, inactiveRoles };
};
