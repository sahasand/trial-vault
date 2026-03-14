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
} from "firebase/firestore";
import { Trial, UpdateTrialData } from "./types";
import { logger } from "./logger";

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
  data: Omit<Trial, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, TRIALS_COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    logger.error("Error creating trial", error);
    throw error;
  }
}

export async function updateTrial(
  id: string,
  data: UpdateTrialData
): Promise<void> {
  try {
    const docRef = doc(db, TRIALS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error("Error updating trial", error);
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
