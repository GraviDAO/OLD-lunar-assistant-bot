import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.prod.json";

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
const discordID = "418134977012563989";
const walletAddress = "terra1j5g8xf526dahmg8eueegcnjetckldfcpu3tlq3";
db.collection("users")
  .where("wallet", "==", walletAddress)
  .get()
  .then((snapshot) => {
    console.log(snapshot.docs.length);
    snapshot.docs.forEach((doc) => {
      db.collection("users").doc(doc.id).delete();
    });
  });
