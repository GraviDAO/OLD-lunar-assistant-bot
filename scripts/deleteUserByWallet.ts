import commander from "commander";
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

const program = new commander.Command();

program.requiredOption(
  "-w, --wallet-address <walletAddress>",
  "wallet address to unlink"
);

program.parse();

const options = program.opts();

const unlinkWallet = async (walletAddress: string) => {
  const userSnapshot = await db
    .collection("users")
    .where("wallet", "==", walletAddress)
    .get();

  console.log(`Number of linked users: ${userSnapshot.docs.length}`);

  if (userSnapshot.docs.length != 1) {
    console.log("Error, number of linked users is not equal to 1");
    return;
  }

  userSnapshot.docs.forEach((doc) => {
    db.collection("users")
      .doc(doc.id)
      .delete()
      .then(() => {
        console.log(`User unlinked: ${doc.id}`);
      });
  });
};

unlinkWallet(options.walletAddress);
