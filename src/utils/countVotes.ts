import { WalletContents } from "../types";

export const countVotes = (
  walletContents: WalletContents,
  nftAddress: string
): number => {
  try {
    // Calculate how many votes the user has access to
    return (walletContents.nft[nftAddress]?.tokenIds?.length ?? 0) + (walletContents.cw20[nftAddress]?.quantity ?? 0) + (walletContents.stakedNFT[nftAddress]?.tokenIds?.length ?? 0);
  } catch (e) {
    return 0;
  }
};
