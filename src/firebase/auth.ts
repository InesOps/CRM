// src/firebase/auth.ts
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './config';

// Login
export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

// Logout
export const logout = () => signOut(auth);

// Listen to auth state (used in useAuth hook)
export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);