import { GuildConfig } from "../shared/firestoreTypes";
import { checkRulesQualifies } from "./checkRuleQualifies";
import { getRelevantContractAddresses } from "./getRelevantContractAddresses";
import { getWalletContents } from "./getWalletContents";
import { updateAddedPersistedRemovedRoles } from "./updateActiveRemovedRoles";

export const testGetAddedPersistedRemovedRoleIds = async (
  walletAddress: string,
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
) => {
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
    // If lunar is null than we want to query across all guilds
    // Get the guild from the discord client

    // Get the guild rules
    const guildRules = (guildConfigDoc.data() as GuildConfig).rules;

    // Iterate over the guild rules
    for (const guildRule of guildRules) {
      // Get the role corresponding to the guildRule

      // Get ruleQualifies and hasRole
      let ruleQualifies: boolean = await checkRulesQualifies(
        guildRule,
        userTokensCache,
        walletAddress
      );

      const hasRole = false;

      // Propogate the information to addedRoles, persistedRoles, and removedRoles
      updateAddedPersistedRemovedRoles(
        guildConfigDoc.id,
        guildRule.roleId,
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
