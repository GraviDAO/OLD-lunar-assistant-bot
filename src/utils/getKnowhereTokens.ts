import axios from "axios";
import { KnowhereUserItem, WalletContents } from "../types";

export const getKnowhereTokens = async (
  walletAddress: string
): Promise<WalletContents> => {
  let userTokensRes;

  try {
    // query user wallet holdings from knowhere
    userTokensRes = (
      await axios.get(
        `https://prod-backend-mainnet.knowhere.art/sales/on-sell/${walletAddress}`
      )
    ).data as KnowhereUserItem[];

    // Convert knowhere response to usable form
    const userTokens = userTokensRes.reduce(
      (acc: WalletContents, item) => {
        if (acc.nft[item.nftContract]) {
          acc.nft[item.nftContract].tokenIds.push(item.tokenId);
        } else {
          acc.nft[item.nftContract] = { tokenIds: [item.tokenId] };
        }
        return acc;
      },
      { nft: {}, cw20: {}, stakedNFT: {} }
    );

    return userTokens;
  } catch (e) {
    console.error(e);

    console.error(
      "error",
      walletAddress,
      `https://prod-backend-mainnet.knowhere.art/sales/on-sell/${walletAddress}`
    );

    throw new Error("Failed to request the knowhere api");
  }
};
