import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../config.json";
import { testGetAddedPersistedRemovedRoleIds } from "../src/utils/testColdUpdateDiscordRolesForUser";

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

// const userID = "791301617269866507";
const walletAddress = "terra1x78779hzgu3nc3ar0708k89evx4wx6vuxst9ru";
// "terra1qxzjv7spze07t4vjwjp3q2cppm0qx5esqvngdx";

const getRolesOfUser = async () => {
  // get the user document
  // const userDoc = await db.collection("users").doc(userID).get();

  // check that the user document exists
  // if (!userDoc.exists)
  //   throw new UserDocMissingError("Couldn't find user document");

  // get guilds from db
  // later store this in memory for performance reasons
  const guildConfigsSnapshot = await db.collection("guildConfigs").get();

  if (guildConfigsSnapshot.empty) return { activeRoles: {}, removedRoles: {} };

  const roles = await testGetAddedPersistedRemovedRoleIds(
    walletAddress,
    guildConfigsSnapshot
  );

  console.log(roles);
};

getRolesOfUser();
