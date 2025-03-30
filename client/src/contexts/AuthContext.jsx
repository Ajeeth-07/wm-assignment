import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { auth, googleProvider, signInWithPopup } from "../services/firebase";
import { onAuthStateChanged, signOut, GoogleAuthProvider } from "firebase/auth";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Get Firebase ID token
        const token = await user.getIdToken();
        setIdToken(token);

        try {
          // Get user profile from our backend
          const profile = await api.getUserProfile(token);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setIdToken(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Make sure this is directly triggered by a user action (button click)
      const result = await signInWithPopup(auth, googleProvider);

      // Get the user from the result
      const user = result.user;
      console.log("Google sign-in successful:", user.displayName);

      return user;
    } catch (error) {
      console.error("Error signing in with Google:", error);

      // Provide better user feedback based on error type
      if (error.code === "auth/popup-blocked") {
        setError(
          "Popup was blocked. Please allow popups for this site in your browser settings."
        );
      } else if (error.code === "auth/cancelled-popup-request") {
        setError("Sign-in was cancelled.");
      } else {
        setError(`Login error: ${error.message}`);
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      idToken,
      loading,
      signInWithGoogle,
      logout,
      error,
    }),
    [
      currentUser,
      userProfile,
      idToken,
      loading,
      signInWithGoogle,
      logout,
      error,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
