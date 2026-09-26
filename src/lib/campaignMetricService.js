import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

const metricsRef =
  collection(db, "campaignMetrics");

export async function saveCampaignMetric(data) {
  return addDoc(metricsRef, {
    ...data,
    syncedAt: serverTimestamp(),
  });
}

export async function getCampaignMetrics(
  clientId
) {
  const q = query(
    metricsRef,
    where("clientId", "==", clientId),
    orderBy("date", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}