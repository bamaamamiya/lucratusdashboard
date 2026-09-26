import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";
import { getInvoiceById } from "@/lib/server/invoiceService";

export async function GET(
  request,
  { params },
) {
  try {
    await requireAdmin(request);

    const { invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice ID is missing",
        },
        { status: 400 },
      );
    }

    const invoice =
      await getInvoiceById(invoiceId);

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error(
      "INVOICE DETAIL GET ERROR:",
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
      error.message === "INVOICE_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to load invoice",
      },
      { status: 500 },
    );
  }
}