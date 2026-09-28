import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";

import { getDashboardData } from "@/lib/server/dashboardService";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") || null;

    const data = await getDashboardData({
      period,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("DASHBOARD GET ERROR:", error);

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
        error: error.message || "Failed to load dashboard",
      },
      { status: 500 },
    );
  }
}
