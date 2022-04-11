import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";

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

const coleID = "619663424812613662";
const discordID = "164855485831446530";
db.collection("users")
  .doc(discordID)
  .get()
  .then((userDoc) => {
    console.log(userDoc);
    console.log(userDoc.exists);
    console.log(userDoc.data());
  });
