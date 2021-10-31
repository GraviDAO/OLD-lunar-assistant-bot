import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.prod.json";
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

db.collection("guildConfigs")
  .get()
  .then((snapshot) => {
    console.log(snapshot.docs.length);

    const relevantContractAddresses = getRelevantContractAddresses(snapshot);
    console.log(relevantContractAddresses.length);
  });
