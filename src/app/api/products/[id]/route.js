import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/lib/server/productService";

async function handleAuthError(error) {
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

  if (error.message === "PRODUCT_NOT_FOUND") {
    return NextResponse.json(
      {
        success: false,
        error: "Product not found",
      },
      { status: 404 }
    );
  }

  return null;
}

export async function GET(request, { params }) {
  try {
    await requireAdmin(request);

    const { id } = await params;

    const product = await getProductById(id);

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("PRODUCT GET ERROR:", error);

    const authError = await handleAuthError(error);

    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get product",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();

    await updateProduct(id, body);

    const product = await getProductById(id);

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("PRODUCT PUT ERROR:", error);

    const authError = await handleAuthError(error);

    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update product",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin(request);

    const { id } = await params;

    await deleteProduct(id);

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:", error);

    const authError = await handleAuthError(error);

    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete product",
      },
      { status: 500 }
    );
  }
}