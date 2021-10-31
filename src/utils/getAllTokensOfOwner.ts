import { environment } from "../../config.json";
import { UserTokens } from "../types";
import { RandomEarthAPIError } from "../types/errors";
import { getKnowhereTokens } from "./getKnowhereTokens";
import { getRandomEarthTokens } from "./getRandomEarthTokens";
import { getWalletTokensOfOwner } from "./getWalletTokensOfOwner";

export const getAllTokensOfOwner = async (
  walletAddress: string,
  contractAddresses: string[]
) => {
  const userTokensCache: UserTokens = {};

  const unionIntoUserTokensCache = (
    contractAddress: string,
    tokenIds: string[]
  ) => {
    if (userTokensCache[contractAddress]) {
      userTokensCache[contractAddress] = Array.from(
        new Set([...tokenIds, ...userTokensCache[contractAddress]])
      );
    } else {
      userTokensCache[contractAddress] = tokenIds;
    }
  };

  const pendingRequests = [];

  if (environment === "production") {
    // update user tokens cache with random earth in settlement tokens
    pendingRequests.push(
      getRandomEarthTokens(walletAddress)
        .then((randomEarthUserTokens) =>
          Object.entries(randomEarthUserTokens).forEach(
            ([contractAddress, tokenIds]) =>
              unionIntoUserTokensCache(contractAddress, tokenIds)
          )
        )
        .catch((err) => {
          throw new RandomEarthAPIError(
            "Failed to request the randomearth api."
          );
        })
    );

    // update user tokens cache with knowhere art in settlement tokens
    pendingRequests.push(
      getKnowhereTokens(walletAddress)
        .then((knowhereTokens) =>
          Object.entries(knowhereTokens).forEach(
            ([contractAddress, tokenIds]) =>
              unionIntoUserTokensCache(contractAddress, tokenIds)
          )
        )
        .catch((err) => {
          throw new RandomEarthAPIError("Failed to request the knowhere api.");
        })
    );
  }

  // update user tokens cache with all nft contracts
  await Promise.all([
    ...pendingRequests,
    ...contractAddresses.map(async (contractAddress) => {
      const walletTokensOfOwner = await getWalletTokensOfOwner(
        walletAddress,
        contractAddress
      );

      unionIntoUserTokensCache(contractAddress, walletTokensOfOwner.tokens);
    }),
  ]);

  return userTokensCache;
};
