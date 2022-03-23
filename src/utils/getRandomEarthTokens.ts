import axios from "axios";
import { RandomEarthUserItems, WalletContents } from "../types";

export const getRandomEarthTokens = async (
  walletAddress: string
): Promise<WalletContents> => {
  let userTokensRes;

  try {
    const userTokensItems = [];

    // query user wallet holdings from random earth
    userTokensRes = (
      await axios.get(
        `https://randomearth.io/api/items?user_addr=${walletAddress}`
      )
    ).data as RandomEarthUserItems;

    userTokensItems.push(...userTokensRes.items);

    // iterate through all pages of random earth api
    for (let page = 2; page < userTokensRes.pages + 1; page++) {
      userTokensRes = (
        await axios.get(
          `https://randomearth.io/api/items?user_addr=${walletAddress}&page=${page}`
        )
      ).data as RandomEarthUserItems;

      userTokensItems.push(...userTokensRes.items);
    }

    // convert random earth response to usable form
    const userTokens = userTokensItems.reduce(
      (acc: WalletContents, item) => {
        if (acc.nft[item.collection_addr]) {
          acc.nft[item.collection_addr].tokenIds.push(item.token_id);
        } else {
          acc.nft[item.collection_addr] = { tokenIds: [item.token_id] };
        }
        return acc;
      },
      { nft: {}, cw20: {}, stakedNFT: {} }
    );

    return userTokens;
  } catch (error: any) {
    console.error(
      `Failed to call random earth api. Status: ${error.response.status}`
    );

    console.error(
      "error",
      walletAddress,
      `https://randomearth.io/api/items?user_addr=${walletAddress}`
    );

    throw new Error("Failed to request the randomearth api");
  }
};
