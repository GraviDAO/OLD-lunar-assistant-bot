import { User } from "../shared/firestoreTypes";

import { getWalletContents } from "./getWalletContents";
import { countVotes } from "./countVotes";

export const getValidVotes = async (
  userId: string,
  nftAddress: string,
  db: FirebaseFirestore.Firestore,
): Promise<number> => {
  
  try {
    // Get the user document
    const userDoc = await db
      .collection("users")
      .doc(userId)
      .get();

    // Check that the user document exists
    if (!userDoc.exists) return 0;

    // Get the users wallet address
    const walletAddress = (userDoc.data() as User).wallet;

    // Get the users wallet content
    const walletContents = await getWalletContents(walletAddress, { nft: [nftAddress], cw20: [nftAddress], stakedNFT: [nftAddress] }, db);

    // Calculate how many votes the user has access to
    return countVotes(walletContents, nftAddress);
  } catch (e) {
    return 0;;
  }
  
};
