import { environment } from "../../config.json";
import { ContractAddresses, WalletContents } from "../types";
import { RandomEarthAPIError, TokenFetchingError } from "../types/errors";
import { getKnowhereTokens } from "./getKnowhereTokens";
import { getRandomEarthTokens } from "./getRandomEarthTokens";
import { getCW20TokensOfWallet, getWalletTokensOfOwner } from "./terraHelpers";

export const getWalletsContents = async (
  walletAddresses: string[],
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

  const unionIntoCw20Cache = (cw20Address: string, balance: number) => {
    if (userTokensCache.cw20[cw20Address]) {
      userTokensCache.cw20[cw20Address] = {
        quantity: userTokensCache.cw20[cw20Address].quantity + balance,
      };
    } else {
      userTokensCache.cw20[cw20Address] = { quantity: balance };
    }
  };

  const pendingRequests: Promise<any>[] = [];

  if (environment === "production") {
    // Update user tokens cache with random earth in settlement tokens
    walletAddresses.forEach((walletAddress) => {
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
          })
      );

      pendingRequests.push(
        getKnowhereTokens(walletAddress)
          .then((knowhereTokens) =>
            Object.entries(knowhereTokens.nft).forEach(
              ([contractAddress, nftHoldingInfo]) =>
                unionIntoNftCache(contractAddress, nftHoldingInfo.tokenIds)
            )
          )
          .catch((err) => {
            throw new RandomEarthAPIError(
              "Failed to request the knowhere api."
            );
          })
      );
    });

    // Update user tokens cache with knowhere art in settlement tokens
  }

  // Update user tokens cache
  try {
    walletAddresses.forEach((walletAddress) => {
      pendingRequests.push(
        ...contractAddresses.nft.map(async (nftAddress) => {
          const walletTokensOfOwner = await getWalletTokensOfOwner(
            walletAddress,
            nftAddress
          );

          // Update userTokensCache
          unionIntoNftCache(nftAddress, walletTokensOfOwner.tokens);
        }),
        ...contractAddresses.cw20.map(async (cw20Address) => {
          const balanceResponse = await getCW20TokensOfWallet(
            walletAddress,
            cw20Address
          );

          // Update userTokensCache
          unionIntoCw20Cache(cw20Address, balanceResponse.balance);
        })
      );
    });

    await Promise.all([...pendingRequests]);
  } catch (e) {
    throw new TokenFetchingError(
      "Failed to fetch user tokens for unknown reasons. Please report to GraviDAO."
    );
  }

  return userTokensCache;
};
