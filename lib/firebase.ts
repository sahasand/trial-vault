import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
  where,
  limit,
} from "firebase/firestore";
import { Trial, UpdateTrialData } from "./types";
import { logger } from "./logger";

export class DuplicateNctIdError extends Error {
  constructor(public nctId: string) {
    super(`A trial with NCT ID ${nctId} already exists.`);
    this.name = "DuplicateNctIdError";
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

const TRIALS_COLLECTION = "trials";

// Best-effort uniqueness check. Two concurrent creates with the same NCT ID
// can still both succeed (no Firestore-side unique index). Acceptable for V1.
async function findExistingTrialIdByNctId(
  nctId: string,
  excludeId?: string
): Promise<string | null> {
  const q = query(
    collection(db, TRIALS_COLLECTION),
    where("nctId", "==", nctId),
    limit(2)
  );
  const snapshot = await getDocs(q);
  const match = snapshot.docs.find((d) => d.id !== excludeId);
  return match?.id ?? null;
}

export async function getAllTrials(): Promise<Trial[]> {
  try {
    const q = query(
      collection(db, TRIALS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Trial[];
  } catch (error) {
    logger.error("Error fetching trials", error);
    throw error;
  }
}

export async function getTrialById(id: string): Promise<Trial | null> {
  try {
    const docRef = doc(db, TRIALS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Trial;
  } catch (error) {
    logger.error("Error fetching trial", error);
    throw error;
  }
}

export async function createTrial(
  data: Omit<Trial, "id" | "createdAt" | "updatedAt" | "lastSyncedAt">
): Promise<string> {
  try {
    if (data.nctId) {
      const existingId = await findExistingTrialIdByNctId(data.nctId);
      if (existingId) {
        throw new DuplicateNctIdError(data.nctId);
      }
    }

    const payload: Record<string, unknown> = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    // officialTitle is only set by the CT.gov import flow, so its presence
    // signals this trial was synced from the API at create time.
    if (data.officialTitle) {
      payload.lastSyncedAt = serverTimestamp();
    }
    const docRef = await addDoc(collection(db, TRIALS_COLLECTION), payload);
    return docRef.id;
  } catch (error) {
    if (error instanceof DuplicateNctIdError) throw error;
    logger.error("Error creating trial", error);
    throw error;
  }
}

export async function updateTrial(
  id: string,
  data: UpdateTrialData
): Promise<void> {
  try {
    if (data.nctId) {
      const conflictId = await findExistingTrialIdByNctId(data.nctId, id);
      if (conflictId) {
        throw new DuplicateNctIdError(data.nctId);
      }
    }

    const docRef = doc(db, TRIALS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof DuplicateNctIdError) throw error;
    logger.error("Error updating trial", error);
    throw error;
  }
}

export async function syncTrial(
  id: string,
  data: UpdateTrialData
): Promise<void> {
  try {
    const docRef = doc(db, TRIALS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      lastSyncedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error("Error syncing trial", error);
    throw error;
  }
}

export async function deleteTrial(id: string): Promise<void> {
  try {
    const docRef = doc(db, TRIALS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error("Error deleting trial", error);
    throw error;
  }
}

export { db };
