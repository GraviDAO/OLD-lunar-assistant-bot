import { LunarAssistant } from "../index";
import {
  CW20Rule,
  GuildConfig,
  NFTRule,
  StakedNFTRule,
} from "../shared/firestoreTypes";
import { ContractAddresses } from "../types";
import {
  guildRuleToSimpleRule,
  isApiRule,
  isCW20Rule,
  isNFTRule,
  isStakedNFTRule,
} from "./guildRuleHelpers";

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
        } else if (isCW20Rule(simpleRule)) {
          let cw20Rule = simpleRule as CW20Rule;
          acc.cw20.push(cw20Rule.cw20Address);
        } else if (isStakedNFTRule(simpleRule)) {
          let stakedNFTRule = simpleRule as StakedNFTRule;
          acc.stakedNFT.push(stakedNFTRule.stakedNFTAddress);
        } else if (isApiRule(simpleRule)) {
          //apiRule: do nothing
        } else {
          console.error(
            "DO NOT ENTER. Rule didn't match. getContractAddressesRelevantToGuildConfg"
          );
        }
        return acc;
      } catch (err) {
        return acc;
      }
    },
    { nft: [], cw20: [], stakedNFT: [] }
  );

// compute the relevant contract addresses across all guilds where userID is a member of
export const getRelevantContractAddressesForUserID = async (
  guildConfigsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>,
  userID: string,
  lunar: LunarAssistant,
): Promise<ContractAddresses> => {
  const nft = new Set<string>();
  const cw20 = new Set<string>();
  const stakedNFT = new Set<string>();
  for(let index = 0; index < guildConfigsSnapshot.docs.length; index++)
  {
    const guildDoc = guildConfigsSnapshot.docs[index];
    //always use fetch for guildMembers but for guilds cache works fine.
    const guild = lunar.client.guilds.cache.get(guildDoc.id)
    try{
      const member = await guild?.members.fetch(userID);
      //only fetch contract addresses for which the user is a member of
      if(member)
      {
        const guildConfig = guildDoc.data() as GuildConfig;
        console.log("Member of guildId: " + guildDoc.id + " with " + guildConfig.rules.length + " rules");
        const guildConfigContractAddresses =
          getContractAddressesRelevantToGuildConfig(
            guildDoc.data() as GuildConfig
          );

        // add to the set of nft addresses
        guildConfigContractAddresses.nft.forEach((address) =>
          nft.add(address)
        );

        // add to the set of cw20 addresses
        guildConfigContractAddresses.cw20.forEach((address) =>
          cw20.add(address)
        );

        guildConfigContractAddresses.stakedNFT.forEach((address) =>
          stakedNFT.add(address)
        );
      }
    }
    catch(err){
      //do nothing
    }
  }
  const contractAddresses: ContractAddresses = {
    nft: Array.from(nft),
    cw20: Array.from(cw20),
    stakedNFT: Array.from(stakedNFT),
  };
  
  console.log("userID: " + userID + " number of relevantNFTContractAddresses: " + contractAddresses.nft.length);
  console.log("userID: " + userID + " number of relevantCW20ContractAddresses: " + contractAddresses.cw20.length);
  console.log("userID: " + userID + " number of relevantStakedContractAddresses: " + contractAddresses.stakedNFT.length);
  return contractAddresses;
};

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

      guildConfigContractAddresses.stakedNFT.forEach((address) =>
        acc.stakedNFT.add(address)
      );

      return acc;
    },
    {
      nft: new Set<string>(),
      cw20: new Set<string>(),
      stakedNFT: new Set<string>(),
    }
  );
  const contractAddresses: ContractAddresses = {
    nft: Array.from(contractAddressesSets.nft),
    cw20: Array.from(contractAddressesSets.cw20),
    stakedNFT: Array.from(contractAddressesSets.stakedNFT),
  };
  return contractAddresses;
};
