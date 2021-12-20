import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";
import { Users } from "../src/shared/firestoreTypes";

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

const analysis = async () => {
  const guildConfigSnapshot = await db.collection("guildConfigs").get();

  // Number of registered discord servers
  console.log(
    "Number of registered discord servers: " + guildConfigSnapshot.docs.length
  );

  // // Number of unique nft addresses
  // const relevantContractAddresses =
  //   getRelevantContractAddresses(guildConfigSnapshot);
  // console.log(
  //   "Number of unique nft addresses across registered rules: " +
  //     relevantContractAddresses.length
  // );

  // Number of users
  const users = (
    await db.collection("root").doc("users").get()
  ).data() as Users;
  console.log("Number of registered users: " + users.discordIds.length);
};

analysis();
