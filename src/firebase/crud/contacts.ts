import {
  collection, doc,
  getDocs, addDoc, updateDoc, deleteDoc,
  runTransaction, Timestamp
} from "firebase/firestore";
import { db } from "../config";

// ── Auto-increment ────────────────────────────────────────────────────────────
export async function getNextContactId(): Promise<number> {
  const counterRef = doc(db, "counters", "contacts");
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = snap.exists() ? snap.data().value + 1 : 1;
    tx.set(counterRef, { value: next });
    return next;
  });
}

// ── READ ──────────────────────────────────────────────────────────────────────
export const getContacts  = () => getDocs(collection(db, "contacts"));
export const getProspects = () => getDocs(collection(db, "prospects"));

// ── CREATE ────────────────────────────────────────────────────────────────────
export const addContact  = (data: object) => addDoc(collection(db, "contacts"),  data);
export const addProspect = (data: object) => addDoc(collection(db, "prospects"), data);

// ── UPDATE — only sends changed fields, never overwrites the whole doc ────────
export const updateContact = (id: string, data: object) =>
  updateDoc(doc(db, "contacts", id), { ...data, updatedAt: Timestamp.now() });

export const updateProspect = (id: string, data: object) =>
  updateDoc(doc(db, "prospects", id), { ...data, updatedAt: Timestamp.now() });

// ── DELETE ────────────────────────────────────────────────────────────────────
export const deleteContact  = (id: string) => deleteDoc(doc(db, "contacts",  id));
export const deleteProspect = (id: string) => deleteDoc(doc(db, "prospects", id));