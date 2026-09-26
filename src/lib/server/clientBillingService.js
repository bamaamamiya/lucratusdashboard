import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

export async function getClientMetaAdSpend({ clientId, period }) {
  if (!clientId) {
    throw new Error("clientId is required");
  }

  if (!period) {
    throw new Error("period is required");
  }

  const [year, month] = period.split("-").map(Number);

  const startDate = `${period}-01`;

  const lastDay = new Date(year, month, 0).getDate();

  const endDate = `${period}-${String(lastDay).padStart(2, "0")}`;

  const snapshot = await adminDb
    .collection("campaignMetrics")
    .where("clientId", "==", clientId)
    .where("date", ">=", startDate)
    .where("date", "<=", endDate)
    .get();

  const spend = snapshot.docs.reduce((total, doc) => {
    return total + Number(doc.data().spend || 0);
  }, 0);

  return spend;
}

export async function saveClientBilling(data) {
  if (!data.clientId) {
    throw new Error("clientId is required");
  }

  if (!data.period) {
    throw new Error("period is required");
  }

  const docId = [data.clientId, data.period].join("_");

  const ref = adminDb.collection("clientBilling").doc(docId);

  const serviceFee = Number(data.serviceFee || 0);
  const metaAdSpend = Number(data.metaAdSpend || 0);
  const adSpend = Number(data.adSpend || 0);

  const totalBilled = serviceFee + adSpend;

  const payload = {
    clientId: data.clientId,
    clientName: data.clientName || "",

    period: data.period,

    // Revenue jasa Lucratus
    serviceFee,

    // Actual spend berdasarkan campaignMetrics
    metaAdSpend,

    // Nominal ad spend yang ditagihkan ke client
    adSpend,

    totalBilled,

    // Payment belum terjadi
    amountPaid: 0,
    outstanding: totalBilled,
    paymentStatus: "unpaid",

    // Billing baru dibuat
    billingStatus: "draft",

    dueDate: data.dueDate || "",
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

export async function updateClientBilling(billingId, data) {
  if (!billingId) {
    throw new Error("billingId is required");
  }

  const ref = adminDb
    .collection("clientBilling")
    .doc(billingId);

  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error("BILLING_NOT_FOUND");
  }

  const existing = snap.data();

  // Billing yang sudah punya invoice tidak boleh
  // diedit karena invoice sudah diterbitkan.
  if (existing.invoiceId) {
    throw new Error("BILLING_LOCKED");
  }

  if (!data.clientId) {
    throw new Error("clientId is required");
  }

  if (!data.period) {
    throw new Error("period is required");
  }

  // Pastikan ID billing tetap mengikuti client + period
  const expectedDocId = [data.clientId, data.period].join("_");

  if (expectedDocId !== billingId) {
    throw new Error("BILLING_ID_MISMATCH");
  }

  const serviceFee = Number(data.serviceFee || 0);
  const metaAdSpend = Number(data.metaAdSpend || 0);
  const adSpend = Number(data.adSpend || 0);

  const totalBilled = serviceFee + adSpend;

  await ref.update({
    clientId: data.clientId,
    clientName: data.clientName || "",

    period: data.period,

    serviceFee,
    metaAdSpend,
    adSpend,

    totalBilled,

    // Karena belum ada invoice/payment
    amountPaid: 0,
    outstanding: totalBilled,
    paymentStatus: "unpaid",
    billingStatus: "draft",

    dueDate: data.dueDate || "",
    notes: data.notes || "",

    updatedAt: FieldValue.serverTimestamp(),
  });

  return billingId;
}

export async function deleteClientBilling(billingId) {
  if (!billingId) {
    throw new Error("billingId is required");
  }

  const ref = adminDb
    .collection("clientBilling")
    .doc(billingId);

  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error("BILLING_NOT_FOUND");
  }

  const billing = snap.data();

  // Jangan boleh delete billing yang sudah
  // menjadi dasar invoice.
  if (billing.invoiceId) {
    throw new Error("BILLING_LOCKED");
  }

  await ref.delete();

  return billingId;
}

export async function getClientBillings({
  clientId = null,
  period = null,
} = {}) {
  let query = adminDb.collection("clientBilling");

  if (clientId) {
    query = query.where("clientId", "==", clientId);
  }

  if (period) {
    query = query.where("period", "==", period);
  }

  const snapshot = await query.get();

  const billings = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return billings.sort((a, b) => {
    return String(b.period || "").localeCompare(
      String(a.period || ""),
    );
  });
}