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
      // Perform Firebase authentication
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Get the Firebase ID token (not just OAuth access token)
      const idToken = await user.getIdToken();
      setIdToken(idToken);
      setCurrentUser(user);

      try {
        // Try to exchange with backend - but don't fail the whole login if this fails
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential.accessToken;

        if (accessToken) {
          // Store the token in backend
          await api.storeUserTokens(user.uid, {
            access_token: accessToken,
            id_token: idToken,
          });
        }
      } catch (backendError) {
        // Log backend error but don't fail the authentication
        console.warn("Backend token exchange failed:", backendError);
        console.warn("Google Drive features may be limited");
      }

      return user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
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
    }),
    [currentUser, userProfile, idToken, loading, signInWithGoogle, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
