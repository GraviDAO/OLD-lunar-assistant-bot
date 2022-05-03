import axios from "axios";
import { RandomEarthUserItems, WalletContents } from "../types";
import { mock_mode } from "../../config.json";
import data from "../../tests/RandomEarthResponse.json";

export const getRandomEarthTokens = async (
  walletAddress: string
): Promise<WalletContents> => {
  let userTokensRes;

  try {
    const userTokensItems = [];

    //running in dev mode with random earth response in a file
    if(mock_mode) {
      userTokensRes = data as RandomEarthUserItems;
      userTokensItems.push(...userTokensRes.items);
    } else {
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

        await new Promise((r) => setTimeout(r, 2000));

        userTokensItems.push(...userTokensRes.items);
      }
    }
    //Filter out anything that is not in settlement as it will be picked up by the smart contract query
    const filteredUserTokensItems = userTokensItems.filter(x => x.in_settlement == true);
    
    // convert random earth response to usable form
    const userTokens = filteredUserTokensItems.reduce(
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
