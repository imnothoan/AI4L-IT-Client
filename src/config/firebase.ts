import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Firebase Configuration
 * Initialize Firebase services for the application
 * 
 * Note: Firebase Storage is not used. Images are stored as base64 strings
 * in Firestore to avoid storage costs.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Check if running in dev mode without Firebase config
const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
const hasFirebaseConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_firebase_api_key';

if (hasFirebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else if (!isDevMode) {
  console.error('Firebase configuration is missing. Please set up Firebase environment variables.');
}

export { app, auth, db, isDevMode, hasFirebaseConfig };
