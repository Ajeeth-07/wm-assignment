import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { Button, Typography, Box, CircularProgress } from "@mui/material";

const GoogleDriveAuth = () => {
  const [status, setStatus] = useState("loading"); // loading, connected, disconnected
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { idToken, currentUser } = useAuth();

  useEffect(() => {
    if (idToken) {
      checkOAuthStatus();

      // Check for OAuth results from the callback page
      const oauthSuccess = localStorage.getItem("googleOAuthSuccess");
      if (oauthSuccess) {
        const tokens = JSON.parse(localStorage.getItem("googleTokens") || "{}");

        // Clear storage immediately for security
        localStorage.removeItem("googleOAuthSuccess");
        localStorage.removeItem("googleTokens");

        // Store tokens in backend and update status
        if (tokens && currentUser) {
          storeTokensAndUpdateStatus(tokens);
        }
      }

      const oauthError = localStorage.getItem("googleOAuthError");
      if (oauthError) {
        setError("Authentication error: " + oauthError);
        localStorage.removeItem("googleOAuthError");
      }
    }
  }, [idToken, currentUser]);

  const checkOAuthStatus = async () => {
    try {
      const response = await api.checkOAuthStatus(idToken);
      setStatus(response.status === "connected" ? "connected" : "disconnected");
    } catch (error) {
      console.error("Error checking OAuth status:", error);
      setStatus("disconnected");
    }
  };

  const storeTokensAndUpdateStatus = async (tokens) => {
    try {
      await api.storeUserTokens(currentUser.uid, tokens);
      setStatus("connected");
    } catch (error) {
      console.error("Error storing tokens:", error);
      setError("Failed to store Google credentials: " + error.message);
    }
  };

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      // Get auth URL with correct redirect
      const redirectUri = window.location.origin + "/auth/google-callback";
      const { url } = await api.getGoogleAuthUrl(redirectUri);

      if (!url) {
        throw new Error("Failed to get Google authentication URL");
      }

      // Open in same window to avoid popup blockers
      window.location.href = url;
    } catch (error) {
      console.error("Error connecting to Google:", error);
      setError("Failed to connect to Google Drive: " + error.message);
      setIsLoading(false);
    }
  };

  // Replace the forceReconnect function with this simpler version
  const forceReconnect = async () => {
    setIsLoading(true);
    setError("");
    setMessage("Preparing reconnection...");

    try {
      // Just get a new auth URL with force=true
      const redirectUri = window.location.origin + "/auth/google-callback";
      const response = await api.getGoogleAuthUrl(redirectUri, true);

      if (response && response.url) {
        setMessage("Redirecting to Google authentication...");
        // Redirect the user to the Google auth page
        window.location.href = response.url;
      } else {
        throw new Error("Failed to get authentication URL");
      }
    } catch (error) {
      console.error("Error reconnecting to Google:", error);
      setError("Failed to reconnect: " + error.message);
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <CircularProgress size={24} />;
  }

  return (
    <Box>
      {status === "connected" ? (
        <>
          <Typography color="success.main" mb={1}>
            ✓ Connected to Google Drive
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={forceReconnect}
            disabled={isLoading}
          >
            Reconnect with Full Permissions
          </Button>
        </>
      ) : (
        <>
          {error && <Typography color="error.main">{error}</Typography>}
          {message && <Typography color="info.main">{message}</Typography>}
          <Button
            variant="outlined"
            color="primary"
            onClick={handleConnectGoogle}
            disabled={isLoading}
            startIcon={isLoading && <CircularProgress size={20} />}
          >
            {isLoading ? "Connecting..." : "Connect to Google Drive"}
          </Button>
        </>
      )}
    </Box>
  );
};

export default GoogleDriveAuth;
