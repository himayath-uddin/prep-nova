// ─────────────────────────────────────────────────────────────────────────────
// src/lib/firebase.ts
//
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com
// 2. Create a project (or open your existing one)
// 3. Click the </> web icon to "Add a web app"
// 4. Copy the firebaseConfig values shown and paste into your .env file:
//    VITE_FIREBASE_API_KEY=...
//    VITE_FIREBASE_AUTH_DOMAIN=...
//    VITE_FIREBASE_PROJECT_ID=...
//    VITE_FIREBASE_STORAGE_BUCKET=...
//    VITE_FIREBASE_MESSAGING_SENDER_ID=...
//    VITE_FIREBASE_APP_ID=...
// 5. In the Firebase console sidebar: Build → Firestore Database → Create database
// 6. In the Firebase console sidebar: Build → Authentication → Get started → Enable Email/Password
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
  type DocumentData,
} from "firebase/firestore";

// ─── Lazy singletons (only initialized client-side) ──────────────────────────

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app;
  const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  };
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}

// Keep these for backward-compat (used by components that import auth/db directly)
export const googleProvider = new GoogleAuthProvider();

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const auth = getFirebaseAuth();
  const db   = getFirebaseDb();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      displayName,
      createdAt: serverTimestamp(),
      sessions: [],
      readinessScore: 0,
    });
  } catch {
    console.warn("Firestore profile write skipped:", user.uid);
  }
  return user;
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return credential.user;
}

export async function loginWithGoogle() {
  const auth = getFirebaseAuth();
  const db   = getFirebaseDb();
  const result = await signInWithPopup(auth, googleProvider);
  const user   = result.user;
  try {
    const ref  = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: serverTimestamp(),
        sessions: [],
        readinessScore: 0,
      });
    }
  } catch {
    console.warn("Firestore upsert skipped for Google user:", user.uid);
  }
  return user;
}

export function logout() {
  return signOut(getFirebaseAuth());
}

export function onUserChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

/** Save a candidate's resume + job description profile */
export async function saveProfile(uid: string, data: {
  resumeText: string;
  jobDescription: string;
  targetRole: string;
}) {
  await updateDoc(doc(getFirebaseDb(), "users", uid), {
    profile: { ...data, updatedAt: serverTimestamp() },
  });
}

/** Save a completed interview session */
export async function saveSession(uid: string, session: {
  twinId: string;
  twinName: string;
  durationMs: number;
  scores: { clarity: number; pace: number; confidence: number; energy: number };
  transcript: { role: "ai" | "user"; text: string }[];
}) {
  const db = getFirebaseDb();
  const sessionRef = doc(collection(db, "users", uid, "sessions"));
  await setDoc(sessionRef, {
    ...session,
    createdAt: serverTimestamp(),
  });
  return sessionRef.id;
}

/** Fetch a user's profile from Firestore */
export async function fetchUserProfile(uid: string): Promise<DocumentData | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "users", uid));
  return snap.exists() ? snap.data() : null;
}
