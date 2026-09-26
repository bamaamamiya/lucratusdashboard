import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";

import {
  saveClientResult,
  getClientResults,
} from "@/lib/server/clientResultService";

export async function POST(request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    const {
      clientId,
      date,
      qualifiedLeads,
      orders,
      revenue,
      grossProfit,
      notes,
    } = body;

    if (!clientId || !date) {
      return NextResponse.json(
        {
          success: false,
          error: "clientId and date are required",
        },
        { status: 400 },
      );
    }

    const docId = await saveClientResult({
      clientId,
      date,
      qualifiedLeads,
      orders,
      revenue,
      grossProfit,
      notes,
    });

    return NextResponse.json({
      success: true,
      id: docId,
    });
  } catch (error) {
    console.error("CLIENT RESULT POST ERROR:", error);

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

    if (error.message === "USER_NOT_FOUND" || error.message === "FORBIDDEN") {
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
        error: error.message || "Failed to save client result",
      },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);

    const clientId = searchParams.get("clientId") || null;

    const startDate = searchParams.get("startDate") || null;

    const endDate = searchParams.get("endDate") || null;

    const results = await getClientResults({
      clientId,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("CLIENT RESULT GET ERROR:", error);

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

    if (error.message === "USER_NOT_FOUND" || error.message === "FORBIDDEN") {
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
        error: error.message || "Failed to get client results",
      },
      { status: 500 },
    );
  }
}
