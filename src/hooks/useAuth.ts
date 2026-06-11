// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';


export type UserRole = 'admin' | 'manager' | 'agent';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    user: null, role: null, loading: true
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, {
            email: firebaseUser.email,
            role: 'agent',
            createdAt: new Date()
          });
        }

        // Re-fetch to get the latest data (including newly created doc)
        const freshSnap = await getDoc(ref);
        const data = freshSnap.data() ?? {};
        const rawRole = data.role ?? 'agent';
        // Map legacy 'user' role to 'agent' for backward compatibility
        const role = (rawRole === 'user' ? 'agent' : rawRole) as UserRole;

        // Mirror profile into 'staff' so admins/managers can list all members
        // without needing elevated rules on the restricted 'users' collection.
        try {
          await setDoc(doc(db, 'staff', firebaseUser.uid), {
            email:     firebaseUser.email ?? '',
            firstName: data.firstName ?? null,
            lastName:  data.lastName  ?? null,
            jobRole:   data.jobRole   ?? null,
            role,
          }, { merge: true });
        } catch {
          // Non-fatal: staff page may be empty until rules are deployed
        }

        setState({ user: firebaseUser, role, loading: false });
      } else {
        setState({ user: null, role: null, loading: false });
      }
    });

    return () => unsub();
  }, []);

  return state;
};