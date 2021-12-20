import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";
import { passportApi } from "../src/services/passport";

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

const discordID = "619663424812613662";

const getUserWallet = async () => {
  const wallet = await passportApi.getWalletsByDiscordId(discordID);
  console.log(wallet);
  console.log(`User wallet: ${wallet}`);
};

getUserWallet();
