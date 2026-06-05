// src/firebase/crud/prospects.ts
import {
  collection, doc,
  getDocs, updateDoc, deleteDoc,
  addDoc, runTransaction,
  query, orderBy, Timestamp
} from "firebase/firestore";
import { db } from "../config";

// ── Auto-increment ────────────────────────────────────────────────────────────
export async function getNextProspectId(): Promise<number> {
  const counterRef = doc(db, "counters", "prospects");
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = snap.exists() ? snap.data().value + 1 : 1;
    tx.set(counterRef, { value: next });
    return next;
  });
}

// ── READ ──────────────────────────────────────────────────────────────────────
export const getProspects = () =>
  getDocs(query(collection(db, "prospects"), orderBy("prospectId")));

// ── CREATE — exactly the fields from the form ─────────────────────────────────
export const addProspect = async (data: {
  Name:           string;
  company:        string;
  email:          string;
  phone:          string;
  stage:          string;
  source:         string;
  value:          number;
  probability:    number;
  nextAction:     string;
  nextActionDate: string;
  assignee:       string;
  notes:          string;
}) => {
  const prospectId = await getNextProspectId();
  return addDoc(collection(db, "prospects"), {
    prospectId,
    Name:           data.Name,
    company:        data.company,
    email:          data.email,
    phone:          data.phone,
    stage:          data.stage,
    source:         data.source,
    value:          data.value,
    probability:    data.probability,
    nextAction:     data.nextAction,
    nextActionDate: data.nextActionDate,
    assignee:       data.assignee,
    notes:          data.notes,
    createdAt:      Timestamp.now(),
  });
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
export const updateProspect = (id: string, data: object) =>
  updateDoc(doc(db, "prospects", id), {
    ...data,
    updatedAt: Timestamp.now(),
  });

// ── DELETE ────────────────────────────────────────────────────────────────────
export const deleteProspect = (id: string) =>
  deleteDoc(doc(db, "prospects", id));