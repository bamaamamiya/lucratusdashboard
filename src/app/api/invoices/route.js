import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";
import {
  createInvoiceFromBilling,
  getInvoices,
} from "@/lib/server/invoiceService";

export async function POST(request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    const { billingId } = body;

    if (!billingId) {
      return NextResponse.json(
        {
          success: false,
          error: "billingId is required",
        },
        { status: 400 },
      );
    }

    const invoice =
      await createInvoiceFromBilling(
        billingId,
      );

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error(
      "INVOICE POST ERROR:",
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

    if (
      error.message === "BILLING_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Billing not found",
        },
        { status: 404 },
      );
    }

    if (
      error.message ===
      "INVOICE_ALREADY_EXISTS"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invoice already exists for this billing",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to create invoice",
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    await requireAdmin(request);

    const { searchParams } =
      new URL(request.url);

    const clientId =
      searchParams.get("clientId") || null;

    const status =
      searchParams.get("status") || null;

    const invoices = await getInvoices({
      clientId,
      status,
    });

    return NextResponse.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error(
      "INVOICE GET ERROR:",
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
          "Failed to get invoices",
      },
      { status: 500 },
    );
  }
}