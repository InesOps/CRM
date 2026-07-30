// src/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

export const firebaseConfig = {
  apiKey: "AIzaSyCCBBrLI_2F_brolDYDb46Rn2b9zMkVqLo",
  authDomain: "crm-pfe.firebaseapp.com",
  projectId: "crm-pfe",
  storageBucket: "crm-pfe.firebasestorage.app",
  messagingSenderId: "687095752531",
  appId: "1:687095752531:web:eebdf4de44274cf1c5a3a6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db   = getFirestore(app);
// Match the region your functions are deployed to (default: us-central1).
export const functions = getFunctions(app);