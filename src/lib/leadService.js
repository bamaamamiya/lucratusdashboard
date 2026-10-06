import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function getLeads() {
  const leadsQuery = query(
    collection(db, "growthAudits"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(leadsQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}