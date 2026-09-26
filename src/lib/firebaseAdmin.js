import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getFirestore,
} from "firebase-admin/firestore";

const privateKey =
  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const firebaseAdmin =
  getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });

export { firebaseAdmin };

export const adminDb = getFirestore(firebaseAdmin);