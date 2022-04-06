import admin, { ServiceAccount } from "firebase-admin";
import commander from "commander";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";
import { Configs } from "../src/shared/firestoreTypes";
import { config } from "winston";

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
  "-c, --contract-address <contractAddress>",
  "contract address to add to the unlistedContracts list"
);

program.parse();

const options = program.opts();

const updateUnlistedContracts = async (contractAddress : string) => {
  const configsDoc = await db.collection("root").doc("configs").get();
  let configs: Configs = configsDoc.exists
  ? (configsDoc.data() as Configs)
  : { unlistedContracts: [] };

  let newConfigs;
  if(configs.hasOwnProperty("unlistedContracts") && configs.unlistedContracts.length > 0) {
    //update the list of contracts covered by marketplaces in the db without duplicates
    newConfigs = {
      unlistedContracts: Array.from(
        new Set([
          ...configs.unlistedContracts,
          contractAddress,
        ])
      )
    }
  } else {
    newConfigs = {
      unlistedContracts: Array.from(
        new Set([
          contractAddress,
        ])
      )
    };
  }
  await db.collection("root").doc("configs").set(newConfigs);
}


  updateUnlistedContracts(options.contractAddress);