import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVrHAfz4MOgtpSI1IspocGBbf16nWDU04",
  authDomain: "assignment-a3612.firebaseapp.com",
  projectId: "assignment-a3612",
  storageBucket: "assignment-a3612.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Add if available
  appId: "YOUR_APP_ID", // Add if available
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { auth, googleProvider, signInWithPopup };
export default app;
