import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "wsapet-ff5fb.firebasestorage.app",  // ADICIONE ISSO
  databaseURL: "https://wsapet-ff5fb.firebaseio.com"
});


const db = admin.firestore();
const storage = admin.storage();

export { db, storage };
