import { CW20Rule, GuildConfig, NFTRule } from "../shared/firestoreTypes";
import { ContractAddresses } from "../types";
import { guildRuleToSimpleRule, isCW20Rule, isNFTRule } from "./guildRuleHelpers";

export const getContractAddressesRelevantToGuildConfig = (
  guildConfig: GuildConfig
): ContractAddresses =>
  guildConfig.rules.reduce(
    (acc: ContractAddresses, guildRule) => {
      try {
        const simpleRule = guildRuleToSimpleRule(guildRule);
        if (isNFTRule(simpleRule)) {
          let nftRule = simpleRule as NFTRule;
          acc.nft.push(nftRule.nftAddress);
        } else if (isCW20Rule(simpleRule)){
          let cw20Rule = simpleRule as CW20Rule;
          acc.cw20.push(cw20Rule.cw20Address);
        } else {
          //apiRule: do nothing
        }
        return acc;
      } catch (err) {
        return acc;
      }
    },
    { nft: [], cw20: [] }
  );

// compute the relevant contract addresses across all guilds
export const getRelevantContractAddresses = (
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>
): ContractAddresses => {
  const contractAddressesSets = guildConfigsSnapshot.docs.reduce(
    (acc, guildConfigDoc) => {
      const guildConfigContractAddresses =
        getContractAddressesRelevantToGuildConfig(
          guildConfigDoc.data() as GuildConfig
        );

      // add to the set of nft addresses
      guildConfigContractAddresses.nft.forEach((address) =>
        acc.nft.add(address)
      );

      // add to the set of cw20 addresses
      guildConfigContractAddresses.cw20.forEach((address) =>
        acc.cw20.add(address)
      );

      return acc;
    },
    { nft: new Set<string>(), cw20: new Set<string>() }
  );
  const contractAddresses: ContractAddresses = {
    nft: Array.from(contractAddressesSets.nft),
    cw20: Array.from(contractAddressesSets.cw20),
  };
  return contractAddresses;
};
