// src/firebase/crud/users.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config';

// Get user document (includes role)
export const getUser = async (uid: string) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

// Create user doc on first login (default role: 'user')
export const createUserIfNotExists = async (uid: string, email: string) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email,
      role: 'user',         // ← default role
      createdAt: new Date()
    });
  }
};