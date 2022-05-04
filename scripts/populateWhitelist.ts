import admin, { ServiceAccount } from "firebase-admin";
import { Whitelist } from "../src/shared/firestoreTypes";
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

const initDatabase = async () => {
    const whitelistDoc = await db.collection("root").doc("whitelist").get();
    const whitelist: Whitelist = whitelistDoc.exists
    ? (whitelistDoc.data() as Whitelist)
    : { serverIds: [] };

    // list from https://docs.google.com/spreadsheets/d/1_wXn5k_62tuQlpVixvtwACl12iKCHqrsrJJ7F1TqGfk/edit#gid=1227641898
    whitelist.serverIds = ["941142114945867786","941712188303880222","936322505902276669","904825214880321586","890387049352413235","894996829631021107","881200105817010258","945304598996996106","547312917834366983","883251856053272576","901050947466321930","940152356975292476","897404610145292299","904825214880321586","897239025327431711","896920466290278420","956530711505035296","918331500112510977","912716061919563796","890961683412041739","930227614218600508","902117535762239518","903228536867946568"];
    
    const whitelistBatch = db.batch();
    whitelistBatch.set(db.collection("root").doc("whitelist"), whitelist);
    await whitelistBatch.commit();
}

initDatabase();
console.log("Database initialized successfully!");