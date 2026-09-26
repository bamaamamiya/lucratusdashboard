import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import {
  createProduct,
  getProducts,
} from "@/lib/server/productService";

export async function GET(request) {
  try {
    await requireAdmin(request);

    const products = await getProducts();

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("PRODUCTS GET ERROR:", error);

    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "INVALID_AUTH_HEADER"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
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
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get products",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await requireAdmin(request);

    const body = await request.json();

    const id = await createProduct(body);

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error("PRODUCTS POST ERROR:", error);

    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "INVALID_AUTH_HEADER"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
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
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create product",
      },
      { status: 500 }
    );
  }
}