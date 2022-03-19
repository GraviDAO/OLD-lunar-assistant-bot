import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";
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

const statsRef = db.collection("root").doc("stats");
const analysis = async () => {
  const guildConfigSnapshot = await db.collection("guildConfigs").get();

  // Number of registered discord servers
  console.log(
    "Number of registered discord servers: " + guildConfigSnapshot.docs.length
  );

  // Number of unique nft addresses
  const relevantContractAddresses =
    getRelevantContractAddresses(guildConfigSnapshot);
  console.log(
    "Number of unique nft addresses across registered rules: " +
      relevantContractAddresses.nft.length
  );

  console.log(
    "Number of unique staked nft addresses across registered rules: " +
      relevantContractAddresses.stakedNFT.length
  );

  console.log(
    "Number of unique cw20 addresses across registered rules: " +
      relevantContractAddresses.cw20.length
  );

  // Number of users
  const usersSnapshot = await db.collection("users").get();
  console.log("Number of registered users: " + usersSnapshot.docs.length);

  statsRef.set({ userCount: usersSnapshot.docs.length });
};

analysis();
