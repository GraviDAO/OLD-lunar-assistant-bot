import axios from "axios";
import { RandomEarthUserItems, UserTokens } from "../types";

export const getRandomEarthTokens = async (walletAddress: string) => {
  let userTokensRes;

  try {
    // query user wallet holdings from random earth
    userTokensRes = (
      await axios.get(
        `https://randomearth.io/api/items?user_addr=${walletAddress}`
      )
    ).data as RandomEarthUserItems;

    // convert random earth response to usable form
    const userTokens = userTokensRes.items.reduce((acc, item) => {
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
