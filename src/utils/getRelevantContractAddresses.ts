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
      ).rules.reduce((acc: string[], guildRule) => {
        try {
          const nftRule = guildRuleToNFTRule(guildRule);
          acc.push(nftRule.nftAddress);
          return acc;
        } catch (err) {
          return acc;
        }
      }, []);

      for (let contractAddress of guildContractAddresses) {
        acc.add(contractAddress);
      }

      return acc;
    }, new Set<string>())
  );
