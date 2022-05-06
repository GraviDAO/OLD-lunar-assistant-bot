import { LunarAssistant } from "..";
import { Poll, PollResults, User } from "../shared/firestoreTypes";
import { getWalletContents } from "./getWalletContents";
import db from "../services/admin";
import { countVotes } from "./countVotes";

export const calculatePollResults = async (
  lunarAssistant: LunarAssistant,
  poll: Poll
): Promise<PollResults> => {
  const results = {
    total: 0,
    yes: 0,
    abstain: 0,
    no: 0,
  };
  for (const yes of poll.votes.yes) {
    try {
      // Get the user document
      const userDoc = await lunarAssistant.db
        .collection("users")
        .doc(yes)
        .get();

      // Check that the user document exists
      if (!userDoc.exists) continue;

      // Get the users wallet address
      const walletAddress = (userDoc.data() as User).wallet;

      // Get the users wallet content
      const walletContents = await getWalletContents(walletAddress, {
        nft: [poll.contractAddress],
        cw20: [poll.contractAddress],
        stakedNFT: [poll.contractAddress],
      });

      // Calculate how many votes the user has access to
      results.yes =
        results.yes + countVotes(walletContents, poll.contractAddress);
    } catch (e) {
      continue;
    }
  }
  for (const no of poll.votes.no) {
    try {
      // Get the user document
      const userDoc = await lunarAssistant.db.collection("users").doc(no).get();

      // Check that the user document exists
      if (!userDoc.exists) continue;

      // Get the users wallet address
      const walletAddress = (userDoc.data() as User).wallet;

      // Get the users wallet content
      const walletContents = await getWalletContents(walletAddress, {
        nft: [poll.contractAddress],
        cw20: [],
        stakedNFT: [poll.contractAddress],
      });

      // Calculate how many votes the user has access to
      results.no =
        results.no + countVotes(walletContents, poll.contractAddress);
    } catch (e) {
      continue;
    }
  }
  for (const abstain of poll.votes.abstain) {
    try {
      // Get the user document
      const userDoc = await lunarAssistant.db
        .collection("users")
        .doc(abstain)
        .get();

      // Check that the user document exists
      if (!userDoc.exists) continue;

      // Get the users wallet address
      const walletAddress = (userDoc.data() as User).wallet;

      // Get the users wallet content
      const walletContents = await getWalletContents(walletAddress, {
        nft: [poll.contractAddress],
        cw20: [],
        stakedNFT: [poll.contractAddress],
      });

      // Calculate how many votes the user has access to
      results.abstain =
        results.abstain + countVotes(walletContents, poll.contractAddress);
    } catch (e) {
      continue;
    }
  }

  results.total = results.no + results.yes + results.abstain;

  return results;
};
