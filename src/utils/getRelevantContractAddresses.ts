import { GuildConfig } from "../shared/firestoreTypes";
import { guildRuleToNFTRule } from "./guildRuleToNFTRule";

// compute the relevant contract addresses across all guilds
export const getRelevantContractAddresses = (
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
) =>
  Array.from(
    guildConfigsSnapshot.docs.reduce((acc, guildConfigDoc) => {
      const guildContractAddresses = (
        guildConfigDoc.data() as GuildConfig
      ).rules.map((guildRule) => {
        const nftRule = guildRuleToNFTRule(guildRule);
        return nftRule.nftAddress;
      });

      for (let contractAddress of guildContractAddresses) {
        acc.add(contractAddress);
      }

      return acc;
    }, new Set<string>())
  );
