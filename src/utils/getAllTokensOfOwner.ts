import { environment } from "../../config.json";
import { ContractAddresses, WalletContents } from "../types";
import { RandomEarthAPIError, TokenFetchingError } from "../types/errors";
import { getKnowhereTokens } from "./getKnowhereTokens";
import { getRandomEarthTokens } from "./getRandomEarthTokens";
import { getCW20TokensOfWallet, getWalletTokensOfOwner } from "./terraHelpers";

export const getWalletContentsOfWallet = async (
  walletAddress: string,
  contractAddresses: ContractAddresses
): Promise<WalletContents> => {
  const userTokensCache: WalletContents = { nft: {}, cw20: {} };

  const unionIntoNftCache = (contractAddress: string, tokenIds: string[]) => {
    if (userTokensCache.nft[contractAddress]) {
      userTokensCache.nft[contractAddress] = {
        tokenIds: Array.from(
          new Set([
            ...tokenIds,
            ...userTokensCache.nft[contractAddress].tokenIds,
          ])
        ),
      };
    } else {
      userTokensCache.nft[contractAddress] = { tokenIds };
    }
  };

  const pendingRequests = [];

  if (environment === "production") {
    // Update user tokens cache with random earth in settlement tokens
    pendingRequests.push(
      getRandomEarthTokens(walletAddress)
        .then((randomEarthUserTokens) =>
          Object.entries(randomEarthUserTokens).forEach(
            ([contractAddress, tokenIds]) =>
              unionIntoNftCache(contractAddress, tokenIds)
          )
        )
        .catch((err) => {
          throw new RandomEarthAPIError(
            "Failed to request the randomearth api."
          );
        })
    );

    // Update user tokens cache with knowhere art in settlement tokens
    pendingRequests.push(
      getKnowhereTokens(walletAddress)
        .then((knowhereTokens) =>
          Object.entries(knowhereTokens).forEach(
            ([contractAddress, tokenIds]) =>
              unionIntoNftCache(contractAddress, tokenIds)
          )
        )
        .catch((err) => {
          throw new RandomEarthAPIError("Failed to request the knowhere api.");
        })
    );
  }

  // Update user tokens cache
  try {
    await Promise.all([
      ...pendingRequests,
      ...contractAddresses.nft.map(async (nftAddress) => {
        const walletTokensOfOwner = await getWalletTokensOfOwner(
          walletAddress,
          nftAddress
        );

        // update userTokensCache
        unionIntoNftCache(nftAddress, walletTokensOfOwner.tokens);
      }),
      ...contractAddresses.cw20.map(async (cw20Address) => {
        const balanceResponse = await getCW20TokensOfWallet(
          walletAddress,
          cw20Address
        );

        // update userTokensCache
        userTokensCache.cw20[walletAddress] = {
          quantity: balanceResponse.balance,
        };
      }),
    ]);
  } catch (e) {
    throw new TokenFetchingError(
      "Failed to fetch user tokens for unknown reasons. Please report to GraviDAO."
    );
  }

  return userTokensCache;
};
