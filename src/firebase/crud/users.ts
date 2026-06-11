// src/firebase/crud/users.ts
import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc,
  getDocs, query, where
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, firebaseConfig } from '../config';
import type { UserRole } from '../../hooks/useAuth';

export interface StaffMember {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  jobRole?: string;
  role: UserRole;
  createdAt?: any;
}

export const getUser = async (uid: string) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const createUserIfNotExists = async (uid: string, email: string) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { email, role: 'agent', createdAt: new Date() });
  }
};

// Reads from the 'staff' collection (mirror of user profiles) so that listing
// all members works without needing list permissions on the 'users' collection.
export const getAllStaff = async (): Promise<StaffMember[]> => {
  const snap = await getDocs(collection(db, 'staff'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as StaffMember));
};

export const getStaffByRole = async (role: UserRole): Promise<StaffMember[]> => {
  const q = query(collection(db, 'staff'), where('role', '==', role));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as StaffMember));
};

export const getAgents = () => getStaffByRole('agent');

export const updateUserRole = async (uid: string, role: UserRole) => {
  await Promise.all([
    updateDoc(doc(db, 'users', uid), { role }),
    updateDoc(doc(db, 'staff', uid), { role }),
  ]);
};

export const updateUserProfile = async (uid: string, data: Partial<StaffMember>) => {
  const { uid: _uid, ...rest } = data as any;
  await Promise.all([
    updateDoc(doc(db, 'users', uid), rest),
    updateDoc(doc(db, 'staff', uid), rest),
  ]);
};

export const deleteUser = async (uid: string) => {
  await Promise.all([
    deleteDoc(doc(db, 'users', uid)),
    deleteDoc(doc(db, 'staff', uid)),
  ]);
};

export const getAdminCount = async (): Promise<number> => {
  const q = query(collection(db, 'staff'), where('role', '==', 'admin'));
  const snap = await getDocs(q);
  return snap.size;
};

// Creates a Firebase Auth account + Firestore documents without signing out the
// current admin. Uses a disposable secondary app instance to isolate auth state.
export const createStaffMember = async (
  email: string,
  password: string,
  data: { firstName?: string; lastName?: string; jobRole?: string; role: UserRole }
): Promise<StaffMember> => {
  const secondaryApp = initializeApp(firebaseConfig, `staff-create-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = cred.user.uid;
    const profile = {
      email,
      firstName: data.firstName ?? null,
      lastName:  data.lastName  ?? null,
      jobRole:   data.jobRole   ?? null,
      role:      data.role,
      createdAt: new Date(),
    };
    await Promise.all([
      setDoc(doc(db, 'users', uid), profile),
      setDoc(doc(db, 'staff', uid), {
        email,
        firstName: data.firstName ?? null,
        lastName:  data.lastName  ?? null,
        jobRole:   data.jobRole   ?? null,
        role:      data.role,
      }),
    ]);
    return { uid, ...profile };
  } finally {
    await deleteApp(secondaryApp);
  }
};
