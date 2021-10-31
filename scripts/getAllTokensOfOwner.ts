import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";
import { getAllTokensOfOwner } from "../src/utils/getAllTokensOfOwner";
import { getRelevantContractAddresses } from "../src/utils/getRelevantContractAddresses";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        FIREBASE_ADMIN_SERVICE_ACCOUNT as ServiceAccount
      ),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}
const db = admin.firestore();

const walletAddress = "terra1qxzjv7spze07t4vjwjp3q2cppm0qx5esqvngdx";

db.collection("guildConfigs")
  .get()
  .then(async (snapshot) => {
    const relevantContractAddresses = getRelevantContractAddresses(snapshot);

    console.log(relevantContractAddresses, relevantContractAddresses.length);

    const allTokensOfOwner = await getAllTokensOfOwner(
      walletAddress,
      relevantContractAddresses
    );

    console.log(allTokensOfOwner);
  });
