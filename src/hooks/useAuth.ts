// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';  // ← direct import
import { doc, getDoc, setDoc } from 'firebase/firestore';  // ← direct import
import { auth, db } from '../firebase/config';             // ← direct import

interface AuthState {
  user: User | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    user: null, role: null, loading: true
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 auth state changed:", firebaseUser?.email); // ← temp debug
      
      if (firebaseUser) {
        // Auto-create doc if first login
        const ref = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(ref);
        
        if (!snap.exists()) {
          await setDoc(ref, {
            email: firebaseUser.email,
            role: 'user',
            createdAt: new Date()
          });
        }

        const role = snap.data()?.role ?? 'user';
        console.log("👤 role fetched:", role); // ← temp debug
        
        setState({ user: firebaseUser, role, loading: false });
      } else {
        setState({ user: null, role: null, loading: false });
      }
    });

    return () => unsub();
  }, []);

  return state;
};