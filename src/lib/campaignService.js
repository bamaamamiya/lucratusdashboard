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
  where,
} from "firebase/firestore";

import { db } from "./firebase";

const campaignsRef = collection(db, "campaigns");

export async function getCampaigns() {
  const q = query(
    campaignsRef,
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function getCampaignsByAccount(adAccountId) {
  const q = query(
    campaignsRef,
    where("adAccountId", "==", adAccountId)
  );

  const snap = await getDocs(q);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function createCampaign(data) {
  return addDoc(campaignsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCampaign(id, data) {
  return updateDoc(doc(db, "campaigns", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeCampaign(id) {
  return deleteDoc(doc(db, "campaigns", id));
}