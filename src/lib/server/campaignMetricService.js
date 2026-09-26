import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

export async function saveCampaignMetric(data) {
  if (!data.adAccountId) {
    throw new Error("adAccountId is required");
  }

  if (!data.metaCampaignId) {
    throw new Error("metaCampaignId is required");
  }

  if (!data.date) {
    throw new Error("date is required");
  }

  const docId = [
    data.adAccountId,
    data.metaCampaignId,
    data.date,
  ].join("_");

  console.log("========== METRIC SAVE ==========");
  console.log("DOC ID:", docId);
  console.log("DATA:", data);

  const ref = adminDb
    .collection("campaignMetrics")
    .doc(docId);

  await ref.set(
    {
      ...data,
      syncedAt: FieldValue.serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  console.log("METRIC SAVED:", docId);

  return docId;
}