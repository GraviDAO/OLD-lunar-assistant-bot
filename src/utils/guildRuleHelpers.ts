import {
  CW20Rule,
  GuildRule,
  NFTRule,
  SimpleRule,
} from "../shared/firestoreTypes";

// export const getGuildRuleType = (guildRule: GuildRule): GuildRuleType => {
//   if (Object.keys(guildRule.nft).length > 0) {
//     return "nft-rule";
//   } else if (Object.keys(guildRule.cw20).length > 0) {
//     return "cw20-rule";
//   } else {
//     throw new Error("Malformed GuildRule");
//   }
// };

export const isNFTRule = (simpleRule: SimpleRule) => {
  return "nftAddress" in simpleRule;
};

export const isCW20Rule = (simpleRule: SimpleRule) => {
  return "cw20Rule" in simpleRule;
};

export const guildRuleToSimpleRule = (guildRule: GuildRule): SimpleRule => {
  if (Object.keys(guildRule.nft).length > 0) {
    // build the single NFT rule
    const nftAddresses = Object.keys(guildRule.nft);
    if (nftAddresses.length !== 1) throw new Error("Malformed GuildRule");
    const nftAddress = nftAddresses[0];
    const rule: NFTRule = {
      nftAddress,
      tokenIds: guildRule.nft[nftAddress].tokenIds,
      quantity: guildRule.nft[nftAddress].quantity,
      roleName: guildRule.roleName,
    };
    return rule;
  } else if (Object.keys(guildRule.cw20).length > 0) {
    // build the single cw20 rule
    const cw20Addresses = Object.keys(guildRule.nft);
    if (cw20Addresses.length !== 1) throw new Error("Malformed GuildRule");
    const cw20Address = cw20Addresses[0];
    const rule: CW20Rule = {
      cw20Address: cw20Address,
      quantity: guildRule.cw20[cw20Address].quantity,
      roleName: guildRule.roleName,
    };
    return rule;
  } else {
    throw new Error("Malformed GuildRule");
  }
};
