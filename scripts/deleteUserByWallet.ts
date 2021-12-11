import commander from "commander";
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

const program = new commander.Command();

program.requiredOption(
  "-w, --wallet-address <walletAddress>",
  "wallet address to unlink"
);

program.parse();

const options = program.opts();

const unlinkWallet = async (walletAddress: string) => {
  const res = await passportApi.unlinkAddressFromDiscord(walletAddress);

  console.log(res);

  console.log("User wallet unlinked");
};

unlinkWallet(options.walletAddress);
