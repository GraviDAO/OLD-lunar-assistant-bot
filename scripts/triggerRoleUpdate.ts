import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";
import { User } from "../src/shared/firestoreTypes";

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

const discordID = "877111583879344158";

const triggerRoleUpdate = async () => {
  const userDoc = await db
    .collection("users")

    .doc(discordID)
    .get();

  console.log(userDoc);
  console.log(userDoc.exists);
  console.log(userDoc.data());
  //   const newUser: User = {
  //     wallet: "terra1zu5vxgnq48rz3ypjwlsc9luj5zua9kmsrt7r4m",
  //   };
  const newUser: User = { wallet: (userDoc.data() as User).wallet };

  console.log("Deleting user");
  await db.collection("users").doc(discordID).delete();
  console.log("Setting user", newUser);
  await db.collection("users").doc(discordID).set(newUser);
};

triggerRoleUpdate();
