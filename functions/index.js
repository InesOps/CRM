// functions/index.js
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";

initializeApp();

/**
 * Callable: deleteStaffMember
 * Deletes a user from Firebase Auth AND their Firestore users/staff docs.
 * Only callable by a signed-in admin. Rejects self-deletion.
 */
export const deleteStaffMember = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  if (!callerUid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const uid = request.data?.uid;
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "A valid 'uid' is required.");
  }

  const db = getFirestore();

  // Verify the caller is an admin (source of truth: their staff doc).
  const callerSnap = await db.collection("staff").doc(callerUid).get();
  if (callerSnap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can delete members.");
  }

  if (uid === callerUid) {
    throw new HttpsError("failed-precondition", "You cannot delete your own account.");
  }

  // Delete the Auth user. Tolerate an already-missing auth account so the
  // Firestore docs still get cleaned up.
  try {
    await getAuth().deleteUser(uid);
  } catch (err) {
    if (err.code !== "auth/user-not-found") {
      throw new HttpsError("internal", `Failed to delete auth user: ${err.message}`);
    }
  }

  // Delete the Firestore profile docs.
  await Promise.all([
    db.collection("users").doc(uid).delete(),
    db.collection("staff").doc(uid).delete(),
  ]);

  return { success: true };
});
