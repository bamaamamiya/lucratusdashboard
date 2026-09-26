import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebaseAdmin";

function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();

  const snapshot = await adminDb
    .collection("invoices")
    .where("year", "==", year)
    .get();

  const nextNumber = snapshot.size + 1;

  return `INV-${year}-${String(nextNumber).padStart(4, "0")}`;
}

export async function createInvoiceFromBilling(billingId) {
  if (!billingId) {
    throw new Error("billingId is required");
  }

  const billingRef = adminDb
    .collection("clientBilling")
    .doc(billingId);

  const billingSnap = await billingRef.get();

  if (!billingSnap.exists) {
    throw new Error("BILLING_NOT_FOUND");
  }

  const billing = billingSnap.data();

  if (billing.invoiceId) {
    throw new Error("INVOICE_ALREADY_EXISTS");
  }

  const invoiceNumber = await generateInvoiceNumber();

  const items = [];

  if (Number(billing.serviceFee || 0) > 0) {
    items.push({
      type: "service",
      description: "Meta Ads Management",
      amount: Number(billing.serviceFee),
    });
  }

  if (Number(billing.adSpend || 0) > 0) {
    items.push({
      type: "ad_spend",
      description: "Advertising Budget",
      amount: Number(billing.adSpend),
    });
  }

  const total = Number(billing.totalBilled || 0);

  // Invoice baru dibuat.
  // Belum ada payment.
  const amountPaid = 0;

  const outstanding = total;

  const invoiceRef = adminDb
    .collection("invoices")
    .doc();

  const invoiceData = {
    invoiceNumber,

    year: new Date().getFullYear(),

    billingId,

    clientId: billing.clientId,
    clientName: billing.clientName || "",

    period: billing.period,

    issueDate: formatDate(),

    dueDate: billing.dueDate || "",

    items,

    subtotal: total,

    total,

    amountPaid,

    outstanding,

    // Invoice selalu unpaid ketika pertama dibuat
    status: "unpaid",

    notes: billing.notes || "",

    createdAt: FieldValue.serverTimestamp(),

    updatedAt: FieldValue.serverTimestamp(),
  };

  // 1. Create invoice
  await invoiceRef.set(invoiceData);

  // 2. Link invoice back to billing
  await billingRef.update({
    invoiceId: invoiceRef.id,
    invoiceNumber,

    billingStatus: "issued",
    invoiceStatus: "issued",

    // Pastikan billing tetap unpaid
    paymentStatus: "unpaid",
    amountPaid: 0,
    outstanding: total,

    updatedAt: FieldValue.serverTimestamp(),
  });

  // 3. Re-read Firestore document
  //    supaya serverTimestamp() menjadi Timestamp
  const createdInvoiceSnap = await invoiceRef.get();

  const createdInvoice = createdInvoiceSnap.data();

  return {
    id: createdInvoiceSnap.id,
    ...createdInvoice,
  };
}

export async function getInvoices({
  clientId = null,
  status = null,
} = {}) {
  let query = adminDb.collection("invoices");

  if (clientId) {
    query = query.where("clientId", "==", clientId);
  }

  if (status) {
    query = query.where("status", "==", status);
  }

  const snapshot = await query.get();

  const invoices = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return invoices.sort((a, b) => {
    return String(b.createdAt || "").localeCompare(
      String(a.createdAt || ""),
    );
  });
}

export async function getInvoiceById(invoiceId) {
  if (!invoiceId) {
    throw new Error("invoiceId is required");
  }

  const ref = adminDb
    .collection("invoices")
    .doc(invoiceId);

  const snap = await ref.get();

  if (!snap.exists) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  return {
    id: snap.id,
    ...snap.data(),
  };
}