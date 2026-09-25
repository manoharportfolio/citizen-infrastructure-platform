import dotenv from "dotenv";
import {
  initializeApp,
  cert,
  getApps,
} from "firebase-admin/app";
import {
  getFirestore,
} from "firebase-admin/firestore";
import {
  getAuth,
} from "firebase-admin/auth";

dotenv.config();

const projectId =
  process.env.FIREBASE_PROJECT_ID;

const clientEmail =
  process.env.FIREBASE_CLIENT_EMAIL;

const privateKey =
  process.env.FIREBASE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

if (
  !projectId ||
  !clientEmail ||
  !privateKey
) {
  throw new Error(
    "Firebase Admin credentials are missing. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in server/.env"
  );
}

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

console.log(
  "Firebase Admin initialized successfully."
);

export const adminDb =
  getFirestore(firebaseApp);

export const adminAuth =
  getAuth(firebaseApp);