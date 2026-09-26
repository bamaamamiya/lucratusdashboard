import { adminDb } from "@/lib/firebaseAdmin";

export async function getAdAccountById(adAccountId) {
  if (!adAccountId) {
    throw new Error("AD_ACCOUNT_ID_REQUIRED");
  }

  const value = String(adAccountId).trim();

  // =========================================================
  // 1. TRY FIRESTORE DOCUMENT ID
  // =========================================================

  const docRef = adminDb
    .collection("adAccounts")
    .doc(value);

  const snap = await docRef.get();

  if (snap.exists) {
    return {
      id: snap.id,
      ...snap.data(),
    };
  }

  // =========================================================
  // 2. FALLBACK: TRY META AD ACCOUNT ID
  // =========================================================

  const metaSnapshot = await adminDb
    .collection("adAccounts")
    .where("metaId", "==", value)
    .limit(1)
    .get();

  if (!metaSnapshot.empty) {
    const doc = metaSnapshot.docs[0];

    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  // =========================================================
  // 3. NOT FOUND
  // =========================================================

  console.error("AD ACCOUNT NOT FOUND:", {
    requestedId: value,
  });

  throw new Error("AD_ACCOUNT_NOT_FOUND");
}