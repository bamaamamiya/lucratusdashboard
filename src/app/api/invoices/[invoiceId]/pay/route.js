import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function PATCH(request, { params }) {
  try {
    await requireAdmin(request);

    const { invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice ID is required",
        },
        { status: 400 },
      );
    }

    const invoiceRef = adminDb
      .collection("invoices")
      .doc(invoiceId);

    const invoiceSnap = await invoiceRef.get();

    if (!invoiceSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 },
      );
    }

    const invoice = invoiceSnap.data();

    const total = Number(
      invoice.total || 0,
    );

    if (total <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice total must be greater than 0",
        },
        { status: 400 },
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice is already paid",
        },
        { status: 409 },
      );
    }

    const paidAt =
      FieldValue.serverTimestamp();

    await invoiceRef.update({
      amountPaid: total,
      outstanding: 0,
      status: "paid",
      paidAt,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (invoice.billingId) {
      const billingRef = adminDb
        .collection("clientBilling")
        .doc(invoice.billingId);

      await billingRef.update({
        amountPaid: total,
        outstanding: 0,
        paymentStatus: "paid",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invoiceId,
        amountPaid: total,
        outstanding: 0,
        status: "paid",
      },
    });
  } catch (error) {
    console.error(
      "INVOICE PAY ERROR:",
      error,
    );

    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "INVALID_AUTH_HEADER"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (
      error.message === "USER_NOT_FOUND" ||
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to mark invoice as paid",
      },
      { status: 500 },
    );
  }
}