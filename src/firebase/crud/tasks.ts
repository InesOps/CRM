// src/firebase/crud/tasks.ts
import {
  collection, doc,
  getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp
} from 'firebase/firestore';
import { db } from '../config';

const COL = 'tasks';

// READ all tasks (or filter by assignedTo)
export const getTasks = async (uid?: string) => {
  const q = uid
    ? query(collection(db, COL), where('assignedTo', '==', uid))
    : query(collection(db, COL), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// CREATE
export const addTask = (data: object) =>
  addDoc(collection(db, COL), { ...data, createdAt: Timestamp.now() });

// UPDATE
export const updateTask = (id: string, data: object) =>
  updateDoc(doc(db, COL, id), data);

// DELETE
export const deleteTask = (id: string) =>
  deleteDoc(doc(db, COL, id));