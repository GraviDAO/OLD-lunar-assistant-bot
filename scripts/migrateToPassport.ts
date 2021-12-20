import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";
import { passportApi } from "../src/services/passport";
import { User } from "../src/shared/firestoreTypes";

// loop through all users

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

const migrateToPassport = async () => {
  const usersSnapshot = await db.collection("users").get();
  const discordIds: string[] = [];

  const numUsers = usersSnapshot.docs.length;

  // For each doc, link on galactic passport and
  await usersSnapshot.docs.reduce(
    (p, doc, index) =>
      p.then(() => {
        const wallet = (doc.data() as User).wallet;
        discordIds.push(doc.id);
        console.log(
          `Linking ${wallet} to ${doc.id}. ${index + 1} / ${numUsers}`
        );
        return passportApi
          .linkAddressToDiscordId(wallet, doc.id)
          .catch(() => {});
      }),
    new Promise((resolve) => resolve(null))
  );

  // Update the users doc
  await db.collection("root").doc("users").set({ discordIds });
};

migrateToPassport();
