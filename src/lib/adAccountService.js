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

const adAccountsRef = collection(db, "adAccounts");

export async function getAdAccounts() {
  const q = query(
    adAccountsRef,
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function createAdAccount(data) {
  return addDoc(adAccountsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAdAccount(id, data) {
  return updateDoc(doc(db, "adAccounts", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeAdAccount(id) {
  return deleteDoc(doc(db, "adAccounts", id));
}