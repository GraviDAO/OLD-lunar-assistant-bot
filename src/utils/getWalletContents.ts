import { environment } from "../../config.json";
import { ContractAddresses, WalletContents } from "../types";
import { RandomEarthAPIError, TokenFetchingError } from "../types/errors";
import { getKnowhereTokens } from "./getKnowhereTokens";
import { getRandomEarthTokens } from "./getRandomEarthTokens";
import { getCW20TokensOfWallet, getWalletTokensOfOwner } from "./terraHelpers";

export const getWalletContents = async (
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
          Object.entries(randomEarthUserTokens.nft).forEach(
            ([contractAddress, nftHoldingInfo]) =>
              unionIntoNftCache(contractAddress, nftHoldingInfo.tokenIds)
          )
        )
        .catch((err) => {
          throw new RandomEarthAPIError(
            "Failed to request the randomearth api."
          );
          console.error(err);
        })
    );

    // Update user tokens cache with knowhere art in settlement tokens
    pendingRequests.push(
      getKnowhereTokens(walletAddress)
        .then((knowhereTokens) =>
          Object.entries(knowhereTokens.nft).forEach(
            ([contractAddress, nftHoldingInfo]) =>
              unionIntoNftCache(contractAddress, nftHoldingInfo.tokenIds)
          )
        )
        .catch((err) => {
          throw new RandomEarthAPIError("Failed to request the knowhere api.");
        })
    );
  } else {
    // Only request nfts at the contract level in dev
    // in order to avoid 429 errors from the number of nft contracts
    pendingRequests.push(
      ...contractAddresses.nft.map(async (nftAddress) => {
        const walletTokensOfOwner = await getWalletTokensOfOwner(
          walletAddress,
          nftAddress
        );

        // Update userTokensCache
        unionIntoNftCache(nftAddress, walletTokensOfOwner.tokens);
      })
    );
  }

  // Get the cw20 tokens
  pendingRequests.push(
    ...contractAddresses.cw20.map(async (cw20Address) => {
      const balanceResponse = await getCW20TokensOfWallet(
        walletAddress,
        cw20Address
      );

      // Update userTokensCache
      userTokensCache.cw20[cw20Address] = {
        quantity: balanceResponse.balance,
      };
    })
  );

  // Update user tokens cache
  try {
    await Promise.all(pendingRequests);
  } catch (e) {
    console.error(
      "Failed to fetch user tokens for unknown reasons. Please report to GraviDAO."
    );
    console.error(e);
    throw new TokenFetchingError(
      "Failed to fetch user tokens for unknown reasons. Please report to GraviDAO."
    );
  }

  return userTokensCache;
};
