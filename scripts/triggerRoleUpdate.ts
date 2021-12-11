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

//cole id 619663424812613662
// const discordID = "619663424812613662";

// const discordID = "877111583879344158";
const address = "oijoij";

const triggerRoleUpdate = async () => {
  const discordId = await passportApi.getDiscordIdByWallet(address);

  // unlink wallet

  console.log("Unlinking wallet");
  await passportApi.unlinkAddressFromDiscord(address);

  // relink wallet
  console.log("Relinking wallet");
  await passportApi.linkAddressToDiscordId(address, discordId);
};

triggerRoleUpdate();
