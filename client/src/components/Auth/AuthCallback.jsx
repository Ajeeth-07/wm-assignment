import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

const AuthCallback = () => {
  const [status, setStatus] = useState("Processing authentication...");
  const [error, setError] = useState(null);
  const [code, setCode] = useState(null);
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth(); // Get loading state too

  // First useEffect to capture the code when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code");
    console.log("Auth callback received, code present:", !!authCode);

    if (authCode) {
      setCode(authCode);
    } else {
      setError("No authorization code found in URL parameters");
    }
  }, []);

  // Second useEffect to process the code once user is loaded
  useEffect(() => {
    async function handleCallback() {
      // Only proceed if we have both the code and the user
      if (!code || loading) return;

      if (!currentUser) {
        setError("Please log in to complete Google Drive authorization");
        return;
      }

      try {
        console.log("User authenticated:", currentUser.uid);
        setStatus("Exchanging code for tokens...");

        // Exchange the code for tokens
        const response = await api.exchangeGoogleCode({
          code,
          redirectUri:
            "https://wm-assignment-backend.onrender.com/auth/google-callback",
        });

        console.log(
          "Token exchange response:",
          response.data ? "Success" : "Failed"
        );

        if (!response.data || !response.data.tokens) {
          throw new Error("Failed to receive tokens from server");
        }

        setStatus("Saving tokens...");

        // Store the tokens
        await api.storeUserTokens(currentUser.uid, response.data.tokens);

        setStatus("Successfully connected to Google Drive!");

        // Navigate back to homepage after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (error) {
        console.error("Auth callback error:", error);
        setError(error.message || "Failed to complete authentication");
      }
    }

    handleCallback();
  }, [code, currentUser, loading, navigate]);

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Google Drive Authorization
      </h2>

      {error ? (
        <div className="bg-red-100 p-4 mb-4 rounded text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => navigate("/")}
          >
            Return Home
          </button>
        </div>
      ) : (
        <div className="bg-blue-100 p-4 rounded text-blue-700 text-center">
          <p>{status}</p>
          {status !== "Successfully connected to Google Drive!" && (
            <div className="loader mt-4 mx-auto"></div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthCallback;
