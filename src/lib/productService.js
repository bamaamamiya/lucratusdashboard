import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export async function getProducts() {
  const q = query(collection(db, "products"), where("status", "==", "active"));

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, "products", id));

  return { id: snap.id, ...snap.data() };
}

export async function updateProduct(id, data) {
  return updateDoc(doc(db, "products", id), data);
}

export async function createProduct(data) {
  return addDoc(collection(db, "products"), data);
}
