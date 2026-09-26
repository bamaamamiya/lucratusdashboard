import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";

import {
  saveClientBilling,
  updateClientBilling,
  deleteClientBilling,
  getClientBillings,
} from "@/lib/server/clientBillingService";

export async function POST(request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    const {
      clientId,
      clientName,
      period,
      serviceFee,
      metaAdSpend,
      adSpend,
      dueDate,
      notes,
    } = body;

    if (!clientId || !period) {
      return NextResponse.json(
        {
          success: false,
          error: "clientId and period are required",
        },
        { status: 400 },
      );
    }

    const docId = await saveClientBilling({
      clientId,
      clientName,
      period,
      serviceFee,
      metaAdSpend,
      adSpend,
      dueDate,
      notes,
    });

    return NextResponse.json({
      success: true,
      id: docId,
    });
  } catch (error) {
    console.error("CLIENT BILLING POST ERROR:", error);

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
          "Failed to save client billing",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);

    const billingId = searchParams.get("billingId");

    if (!billingId) {
      return NextResponse.json(
        {
          success: false,
          error: "billingId is required",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const updatedId = await updateClientBilling(
      billingId,
      body,
    );

    return NextResponse.json({
      success: true,
      id: updatedId,
    });
  } catch (error) {
    console.error("CLIENT BILLING PATCH ERROR:", error);

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

    if (error.message === "BILLING_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          error: "Billing not found",
        },
        { status: 404 },
      );
    }

    if (error.message === "BILLING_LOCKED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Billing cannot be edited because an invoice has already been created.",
        },
        { status: 409 },
      );
    }

    if (error.message === "BILLING_ID_MISMATCH") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Client and period cannot be changed after billing creation.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to update client billing",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);

    const billingId = searchParams.get("billingId");

    if (!billingId) {
      return NextResponse.json(
        {
          success: false,
          error: "billingId is required",
        },
        { status: 400 },
      );
    }

    const deletedId = await deleteClientBilling(
      billingId,
    );

    return NextResponse.json({
      success: true,
      id: deletedId,
    });
  } catch (error) {
    console.error("CLIENT BILLING DELETE ERROR:", error);

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

    if (error.message === "BILLING_NOT_FOUND") {
      return NextResponse.json(
        {
          success: false,
          error: "Billing not found",
        },
        { status: 404 },
      );
    }

    if (error.message === "BILLING_LOCKED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Billing cannot be deleted because an invoice has already been created.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to delete client billing",
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);

    const clientId =
      searchParams.get("clientId") || null;

    const period =
      searchParams.get("period") || null;

    const results = await getClientBillings({
      clientId,
      period,
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("CLIENT BILLING GET ERROR:", error);

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
          "Failed to get client billing",
      },
      { status: 500 },
    );
  }
}