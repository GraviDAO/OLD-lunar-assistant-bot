import { GuildRule, NFTRule } from "../shared/firestoreTypes";

export const guildRuleToNFTRule = (guildRule: GuildRule): NFTRule => {
  // for now we are only handling a single nft rule
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
};
