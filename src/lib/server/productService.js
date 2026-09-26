import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

function cleanProductData(data) {
  return {
    name: data.name || "",
    slug: data.slug || "",
    price: Number(data.price || 0),
    billing: data.billing || "bulan",
    performanceFee: Number(data.performanceFee || 0),
    featured: Boolean(data.featured),
    minimumCommitment: Number(data.minimumCommitment || 0),
    adSpendIncluded: Boolean(data.adSpendIncluded),
    status: data.status || "draft",
    features: Array.isArray(data.features) ? data.features : [],
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function createProduct(data) {
  if (!data.name) {
    throw new Error("Product name is required");
  }

  const payload = {
    ...cleanProductData(data),
    createdAt: FieldValue.serverTimestamp(),
  };

  const ref = await adminDb
    .collection("products")
    .add(payload);

  return ref.id;
}

export async function getProducts() {
  const snapshot = await adminDb
    .collection("products")
    .where("status", "==", "active")
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((a, b) =>
      String(a.name || "").localeCompare(
        String(b.name || ""),
      ),
    );
}

export async function getProductById(id) {
  if (!id) {
    throw new Error("Product ID is required");
  }

  const ref = adminDb
    .collection("products")
    .doc(id);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function updateProduct(id, data) {
  if (!id) {
    throw new Error("Product ID is required");
  }

  const ref = adminDb
    .collection("products")
    .doc(id);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const payload = cleanProductData(data);

  await ref.update(payload);

  return id;
}

export async function deleteProduct(id) {
  if (!id) {
    throw new Error("Product ID is required");
  }

  const ref = adminDb
    .collection("products")
    .doc(id);

  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  await ref.delete();

  return id;
}