import { environment } from "../../config.json";
import { ContractAddresses, WalletContents } from "../types";
import { APICallError, TokenFetchingError } from "../types/errors";
import { Configs } from "../shared/firestoreTypes";
import { getKnowhereTokens } from "./getKnowhereTokens";
import { getMessierArtTokens } from "./getMessierArtTokens";
import { getRandomEarthTokens } from "./getRandomEarthTokens";
import {
  getCW20TokensOfWallet,
  getStakedNFTsOfWallet,
  getWalletTokensOfOwner,
} from "./terraHelpers";

export const getWalletContents = async (
  walletAddress: string,
  contractAddresses: ContractAddresses,
  db: FirebaseFirestore.Firestore,
): Promise<WalletContents> => {
  const userTokensCache: WalletContents = { nft: {}, cw20: {}, stakedNFT: {} };

  console.log(`Getting wallet contents for ${walletAddress}`);
  const start = Date.now();

  const benchmarking = {
    start: start,
    calls: {
      re: {
        end: 0,
        diff: 0,
      },
      knowhere: {
        end: 0,
        diff: 0,
      },
      messier: {
        end: 0,
        diff: 0,
      },
      cw20: {
        end: 0,
        diff: 0,
      },
    },
  };

  const configsDoc = await db.collection("root").doc("configs").get();
  let configs: Configs = configsDoc.exists
  ? (configsDoc.data() as Configs)
  : { unlistedContracts: [] };

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

  const unionIntoStakedNftCache = (
    contractAddress: string,
    tokenIds: string[]
  ) => {
    if (userTokensCache.stakedNFT[contractAddress]) {
      userTokensCache.stakedNFT[contractAddress] = {
        tokenIds: Array.from(
          new Set([
            ...tokenIds,
            ...userTokensCache.stakedNFT[contractAddress].tokenIds,
          ])
        ),
      };
    } else {
      userTokensCache.stakedNFT[contractAddress] = { tokenIds };
    }
  };

  const pendingRequests = [];

  if (environment === "production") {
    // Update user tokens cache with random earth in settlement tokens
    pendingRequests.push(
      getRandomEarthTokens(walletAddress)
        .then((randomEarthUserTokens) => {
          Object.entries(randomEarthUserTokens.nft).forEach(
            ([contractAddress, nftHoldingInfo]) => {
              unionIntoNftCache(contractAddress, nftHoldingInfo.tokenIds)
            });
          benchmarking.calls.re.end = Date.now();
          benchmarking.calls.re.diff =
            benchmarking.calls.re.end - benchmarking.start;
        })
        .catch((err) => {
          console.error(err);
          throw new APICallError("Failed to request the randomearth api.");
        })
    );

    // Update user tokens cache with knowhere art in settlement tokens
    pendingRequests.push(
      getKnowhereTokens(walletAddress)
        .then((knowhereTokens) => {
          Object.entries(knowhereTokens.nft).forEach(
            ([contractAddress, nftHoldingInfo]) => {
              unionIntoNftCache(contractAddress, nftHoldingInfo.tokenIds)
            });

          benchmarking.calls.knowhere.end = Date.now();
          benchmarking.calls.knowhere.diff =
            benchmarking.calls.knowhere.end - benchmarking.start;
        })
        .catch((err) => {
          throw new APICallError("Failed to request the knowhere api.");
        })
    );

    // Update user tokens cache with Messier Art in settlement tokens
    pendingRequests.push(
      getMessierArtTokens(walletAddress)
        .then((messierTokens) => {
          Object.entries(messierTokens.nft).forEach(
            ([contractAddress, nftHoldingInfo]) => {
              unionIntoNftCache(contractAddress, nftHoldingInfo.tokenIds)
            });

          benchmarking.calls.messier.end = Date.now();

          benchmarking.calls.messier.diff =
            benchmarking.calls.messier.end - benchmarking.start;
        })
        .catch((err) => {
          throw new APICallError("Failed to request the Messier Art api.");
        })
    );
    
    //Query smart contract for nft contracts not on marketplaces
    pendingRequests.push(
      ...configs.unlistedContracts.map(async (nftAddress) => {
        const walletTokensOfOwner = await getWalletTokensOfOwner(
          walletAddress,
          nftAddress
        );

        // Update userTokensCache
        unionIntoNftCache(nftAddress, walletTokensOfOwner.tokens);
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

      benchmarking.calls.cw20.end = Date.now();

      benchmarking.calls.cw20.diff =
        benchmarking.calls.cw20.end - benchmarking.start;
    })
  );

  // Get the staked nft tokens
  pendingRequests.push(
    ...contractAddresses.stakedNFT.map(async (stakedNFTAddress) => {
      const stakedTokenIds = await getStakedNFTsOfWallet(
        walletAddress,
        stakedNFTAddress
      );

      // Update userTokensCache
      unionIntoStakedNftCache(stakedNFTAddress, stakedTokenIds.tokens);
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


  console.log(
    `Got wallet contents for: ${walletAddress}. Total time: ${
      Date.now() - start
    }`
  );

  console.log(benchmarking);
  //console.log("userTokensCache: " + JSON.stringify(userTokensCache));

  return userTokensCache;
};
