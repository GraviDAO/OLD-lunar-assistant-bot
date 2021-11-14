import axios from "axios";
import { RandomEarthUserItems, UserTokens } from "../types";

export const getRandomEarthTokens = async (walletAddress: string) => {
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
    const userTokens = userTokensItems.reduce((acc, item) => {
      if (acc[item.collection_addr]) {
        acc[item.collection_addr].push(item.token_id);
      } else {
        acc[item.collection_addr] = [item.token_id];
      }
      return acc;
    }, {} as UserTokens);

    return userTokens;
  } catch (e) {
    console.log(e);

    console.log(
      "error",
      walletAddress,
      `https://randomearth.io/api/items?user_addr=${walletAddress}`
    );

    throw new Error("Failed to request the randomearth api");
  }
};
