// src/firebase/crud/projects.ts
import {
  collection, doc,
  getDocs, addDoc, updateDoc, deleteDoc,
  runTransaction, query, orderBy, Timestamp
} from "firebase/firestore";
import { db } from "../config";

// ── Auto-increment ────────────────────────────────────────────────────────────
export async function getNextProjectId(): Promise<number> {
  const counterRef = doc(db, "counters", "projets");
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = snap.exists() ? snap.data().value + 1 : 1;
    tx.set(counterRef, { value: next });
    return next;
  });
}

// ── READ ──────────────────────────────────────────────────────────────────────
export const getProjects = () =>
  getDocs(query(collection(db, "projets"), orderBy("projectId")));

// ── CREATE ────────────────────────────────────────────────────────────────────
export const addProject = async (data: { name: string; description?: string }) => {
  const projectId = await getNextProjectId();
  return addDoc(collection(db, "projets"), {
    projectId,
    name:        data.name,
    description: data.description ?? "",
    createdAt:   Timestamp.now(),
  });
};

// ── UPDATE ────────────────────────────────────────────────────────────────────
export const updateProject = (id: string, data: object) =>
  updateDoc(doc(db, "projets", id), { ...data, updatedAt: Timestamp.now() });

// ── DELETE ────────────────────────────────────────────────────────────────────
export const deleteProject = (id: string) =>
  deleteDoc(doc(db, "projets", id));
