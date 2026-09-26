import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "./firebase";

const clientsRef = collection(db, "clients");

export async function getClients() {
  const q = query(clientsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function createClient(data) {
  return addDoc(clientsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateClient(id, data) {
  return updateDoc(doc(db, "clients", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeClient(id) {
  return deleteDoc(doc(db, "clients", id));
}