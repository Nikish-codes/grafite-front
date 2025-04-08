import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd17qmwCgSDD88Un45ekcvH_lzDmqEfec",
  authDomain: "grafite-64e59.firebaseapp.com",
  projectId: "grafite-64e59",
  storageBucket: "grafite-64e59.firebasestorage.app",
  messagingSenderId: "598472833264",
  appId: "1:598472833264:web:541cefaf0fe793e0916a35",
  measurementId: "G-ZZMM6NHDXQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Try to enable persistence with fallbacks
const enablePersistence = async () => {
  try {
    // First try indexedDB persistence (more reliable on mobile)
    await setPersistence(auth, indexedDBLocalPersistence);
    console.log("Using indexedDB persistence");
  } catch (indexedDBError) {
    console.warn("IndexedDB persistence failed, trying browser local persistence:", indexedDBError);
    try {
      // Fall back to browser local persistence
      await setPersistence(auth, browserLocalPersistence);
      console.log("Using browser local persistence");
    } catch (browserError) {
      console.error("All persistence methods failed:", browserError);
    }
  }
};

// Enable persistence
enablePersistence().catch(error => {
  console.error("Error in persistence setup:", error);
});

const googleProvider = new GoogleAuthProvider();

// Configure Google provider with parameters to help with redirect issues
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // Add additional parameters to help with redirect flow
  access_type: 'offline',  // Get refresh token
  include_granted_scopes: 'true'
});

export { auth, googleProvider };
export default app;