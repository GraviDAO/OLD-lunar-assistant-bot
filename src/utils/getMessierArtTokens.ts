import axios from "axios";
import { MessierArtUserItems, WalletContents } from "../types";

export const getMessierArtTokens = async (
  walletAddress: string
): Promise<WalletContents> => {
  let userTokensRes;
  let page = 1;

  try {
    const userTokensItems = [];

    // query user wallet holdings from random earth
    userTokensRes = (
      await axios.get(
        `https://api.messier.art/api/user/${walletAddress}/nfts?page_no=${page}`
      )
    ).data as MessierArtUserItems;

    userTokensItems.push(...userTokensRes.data);

    while(userTokensRes.item_count >= 30)
    {
        page = page + 1;
        userTokensRes = (
            await axios.get(
              `https://api.messier.art/api/user/${walletAddress}/nfts?page_no=${page}`
            )
          ).data as MessierArtUserItems;
        userTokensItems.push(...userTokensRes.data);

    }

    // convert Messier Art response to usable form
    const userTokens = userTokensItems.reduce(
      (acc: WalletContents, item) => {
        if (acc.nft[item.nft_contract]) {
          acc.nft[item.nft_contract].tokenIds.push(item.token_id);
        } else {
          acc.nft[item.nft_contract] = { tokenIds: [item.token_id] };
        }
        return acc;
      },
      { nft: {}, cw20: {} }
    );

    return userTokens;
  } catch (e) {
    console.error(e);

    console.error(
      "error",
      walletAddress,
      `https://api.messier.art/api/user/${walletAddress}/nfts?page_no=${page}`
    );

    throw new Error("Failed to request the Messier Art api");
  }
};
