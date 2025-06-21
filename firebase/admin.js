import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://wsapet-ff5fb.firebaseio.com"
});

const db = admin.firestore();
const storage = admin.storage();

export { db, storage };
