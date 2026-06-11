// src/firebase/auth.ts
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  User
} from 'firebase/auth';
import { auth } from './config';

// Await persistence first so signInWithEmailAndPassword never races with a
// pending setPersistence call (which would throw auth/user-storage-busy).
export const login = async (email: string, password: string) => {
  await setPersistence(auth, browserSessionPersistence);
  return signInWithEmailAndPassword(auth, email, password);
};

// Logout
export const logout = () => signOut(auth);

// Listen to auth state (used in useAuth hook)
export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);