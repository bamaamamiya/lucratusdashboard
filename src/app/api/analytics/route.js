import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/server/auth";
import { getAnalytics } from "@/lib/server/analyticsService";

export async function GET(request) {
  try {
    await requireAdmin(request);

    const { searchParams } =
      new URL(request.url);

    const clientId =
      searchParams.get("clientId") || null;

    const startDate =
      searchParams.get("startDate");

    const endDate =
      searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "startDate and endDate are required",
        },
        { status: 400 },
      );
    }

    const analytics =
      await getAnalytics({
        clientId,
        startDate,
        endDate,
      });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error(
      "ANALYTICS API ERROR:",
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
          "Failed to get analytics",
      },
      { status: 500 },
    );
  }
}