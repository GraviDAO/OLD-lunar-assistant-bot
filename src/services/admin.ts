import admin, { ServiceAccount } from "firebase-admin";
import { FIREBASE_ADMIN_SERVICE_ACCOUNT } from "../../config.json";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(FIREBASE_ADMIN_SERVICE_ACCOUNT) as ServiceAccount
      ),
    });
  } catch (error) {
    console.log("Firebase admin initialization error", error);
  }
}
export default admin.firestore();
