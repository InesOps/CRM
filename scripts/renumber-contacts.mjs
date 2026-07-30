// scripts/renumber-contacts.mjs
//
// One-shot migration: renumber every contact's `contactId` to 1, 2, 3, …
// (in the order of their current contactId), then set the auto-increment
// counter so the next new contact continues from N+1.
//
// contactId is display-only (no cross-references), so this is safe.
//
// USAGE (from the project root):
//   node scripts/renumber-contacts.mjs <adminEmail> <adminPassword>
//   node scripts/renumber-contacts.mjs <adminEmail> <adminPassword> --dry-run
//
// --dry-run prints what would change without writing anything.

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore, collection, getDocs, doc, writeBatch,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCCBBrLI_2F_brolDYDb46Rn2b9zMkVqLo",
  authDomain: "crm-pfe.firebaseapp.com",
  projectId: "crm-pfe",
  storageBucket: "crm-pfe.firebasestorage.app",
  messagingSenderId: "687095752531",
  appId: "1:687095752531:web:eebdf4de44274cf1c5a3a6",
};

const [, , email, password, ...flags] = process.argv;
const dryRun = flags.includes("--dry-run");

if (!email || !password) {
  console.error("Usage: node scripts/renumber-contacts.mjs <adminEmail> <adminPassword> [--dry-run]");
  process.exit(1);
}

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

async function main() {
  await signInWithEmailAndPassword(auth, email, password);
  console.log(`Signed in as ${email}`);

  const snap = await getDocs(collection(db, "contacts"));
  const contacts = snap.docs
    .map(d => ({ id: d.id, contactId: d.data().contactId ?? Number.MAX_SAFE_INTEGER }))
    // stable order: by current contactId, then by doc id as tiebreaker
    .sort((a, b) => a.contactId - b.contactId || a.id.localeCompare(b.id));

  if (contacts.length === 0) {
    console.log("No contacts found — nothing to do.");
    return;
  }

  console.log(`\nRenumbering ${contacts.length} contacts:`);
  contacts.forEach((c, i) => {
    const oldId = c.contactId === Number.MAX_SAFE_INTEGER ? "—" : c.contactId;
    console.log(`  ${String(oldId).padStart(4)}  ->  ${i + 1}   (${c.id})`);
  });

  if (dryRun) {
    console.log("\n--dry-run: no writes performed.");
    return;
  }

  // Firestore batches are capped at 500 ops; chunk to stay safe.
  const CHUNK = 400;
  for (let start = 0; start < contacts.length; start += CHUNK) {
    const batch = writeBatch(db);
    const slice = contacts.slice(start, start + CHUNK);
    slice.forEach((c, j) => {
      batch.update(doc(db, "contacts", c.id), { contactId: start + j + 1 });
    });
    // On the final chunk, also reset the counter to the new max.
    if (start + CHUNK >= contacts.length) {
      batch.set(doc(db, "counters", "contacts"), { value: contacts.length });
    }
    await batch.commit();
    console.log(`Committed ${Math.min(start + CHUNK, contacts.length)}/${contacts.length}`);
  }

  console.log(`\nDone. Contacts now numbered 1..${contacts.length}; next id will be ${contacts.length + 1}.`);
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error("\nMigration failed:", err.message || err); process.exit(1); });
