import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const AuthCallback = () => {
  const [status, setStatus] = useState("Processing authentication...");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the code from localStorage (set by the callback page)
        const code = localStorage.getItem("googleAuthCode");

        if (!code) {
          setError("No authorization code found");
          return;
        }

        setStatus("Exchanging code for tokens...");

        // Exchange the code for tokens
        const response = await api.exchangeGoogleCode({
          code,
          redirectUri:
            process.env.GOOGLE_REDIRECT_URI ||
            "https://wm-assignment-backend.onrender.com/auth/google-callback",
        });

        setStatus("Saving tokens...");

        // If user is logged in, store the tokens
        if (user && user.uid && response.data && response.data.tokens) {
          await api.storeFirebaseToken(user.uid, response.data.tokens);
          setStatus("Successfully connected to Google Drive!");

          // Clear the code from localStorage
          localStorage.removeItem("googleAuthCode");

          // Navigate back to homepage after 2 seconds
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          throw new Error("User not authenticated or tokens not received");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setError(error.message || "Failed to complete authentication");
      }
    }

    handleCallback();
  }, [user, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Google Drive Authorization
        </h2>

        {error ? (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            <p className="font-medium">Error</p>
            <p>{error}</p>
            <button
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => navigate("/")}
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
            <p className="text-center">{status}</p>
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
