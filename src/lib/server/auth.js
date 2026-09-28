import { getAuth } from "firebase-admin/auth";
import { firebaseAdmin, adminDb } from "@/lib/firebaseAdmin";

export async function requireAdmin(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    throw new Error("UNAUTHORIZED");
  }

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("INVALID_AUTH_HEADER");
  }

  const idToken = authorization.substring(7);

  if (!idToken) {
    throw new Error("UNAUTHORIZED");
  }

  const adminAuth = getAuth(firebaseAdmin);

  const decodedToken = await adminAuth.verifyIdToken(idToken);

  const userRef = adminDb
    .collection("users")
    .doc(decodedToken.uid);

  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error("USER_NOT_FOUND");
  }

  const userData = userSnap.data();
  const role = userData.role;

  if (!["owner", "admin"].includes(role)) {
    throw new Error("FORBIDDEN");
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email || null,
    role,
    user: userData,
  };
}