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

const walletAddress = "terra1j5g8xf526dahmg8eueegcnjetckldfcpu3tlq3";

const getUserIdByWallet = async () => {
  const userId = await passportApi.getDiscordIdByWallet(walletAddress);

  console.log(`User id: ${userId}`);
};
