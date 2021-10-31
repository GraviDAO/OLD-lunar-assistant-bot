import axios from "axios";
import { KnowhereUserItem, UserTokens } from "../types";

export const getKnowhereTokens = async (walletAddress: string) => {
  let userTokensRes;

  try {
    // query user wallet holdings from knowhere
    userTokensRes = (
      await axios.get(
        `https://prod-backend-mainnet.knowhere.art/sales/on-sell/${walletAddress}`
      )
    ).data as KnowhereUserItem[];

    // convert knowhere response to usable form
    const userTokens = userTokensRes.reduce((acc, item) => {
      if (acc[item.nftContract]) {
        acc[item.nftContract].push(item.tokenId);
      } else {
        acc[item.nftContract] = [item.tokenId];
      }
      return acc;
    }, {} as UserTokens);

    return userTokens;
  } catch (e) {
    console.log(e);

    console.log(
      "error",
      walletAddress,
      `https://prod-backend-mainnet.knowhere.art/sales/on-sell/${walletAddress}`
    );

    throw new Error("Failed to request the knowhere api");
  }
};
