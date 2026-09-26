import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

export async function saveClientResult(data) {
  if (!data.clientId) {
    throw new Error("clientId is required");
  }

  if (!data.date) {
    throw new Error("date is required");
  }

  const docId = [data.clientId, data.date].join("_");

  const ref = adminDb.collection("clientResults").doc(docId);

  const payload = {
    clientId: data.clientId,
    date: data.date,

    qualifiedLeads: Number(data.qualifiedLeads || 0),

    orders: Number(data.orders || 0),

    revenue: Number(data.revenue || 0),

    grossProfit: Number(data.grossProfit || 0),

    notes: data.notes || "",

    updatedAt: FieldValue.serverTimestamp(),
  };

  const snap = await ref.get();

  if (!snap.exists) {
    payload.createdAt = FieldValue.serverTimestamp();
  }

  await ref.set(payload, {
    merge: true,
  });

  return docId;
}

export async function getClientResults({
  clientId = null,
  startDate = null,
  endDate = null,
} = {}) {
  let query = adminDb.collection("clientResults");

  if (clientId) {
    query = query.where("clientId", "==", clientId);
  }

  if (startDate) {
    query = query.where("date", ">=", startDate);
  }

  if (endDate) {
    query = query.where("date", "<=", endDate);
  }

  const snapshot = await query.get();

  const results = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return results.sort((a, b) => b.date.localeCompare(a.date));
}
