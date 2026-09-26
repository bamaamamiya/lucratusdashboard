import { adminDb } from "@/lib/firebaseAdmin";

export async function getCampaignsByAccount(adAccountId) {
  console.log("========== CAMPAIGN LOOKUP ==========");
  console.log("LOOKING FOR FIRESTORE AD ACCOUNT:", adAccountId);

  const snapshot = await adminDb
    .collection("campaigns")
    .where("adAccountId", "==", adAccountId)
    .get();

  console.log("MATCHED CAMPAIGNS:", snapshot.size);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}