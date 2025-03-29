import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Box, Typography, Alert } from "@mui/material";
import api from "../../services/api";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const processAuthCode = async () => {
      try {
        // Extract code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
          throw new Error("No authorization code found in the URL");
        }

        console.log("Authorization code received, exchanging for tokens...");

        // Get the redirect URI that was used
        const redirectUri = window.location.origin + "/auth/google-callback";

        // Exchange code for tokens
        const { data } = await api.getGoogleTokens(code, redirectUri);

        // Store in localStorage temporarily
        localStorage.setItem("googleOAuthSuccess", "true");
        localStorage.setItem("googleTokens", JSON.stringify(data.tokens));

        // Redirect back to editor
        navigate("/editor");
      } catch (error) {
        console.error("Error processing OAuth callback:", error);
        setError(error.message);
        localStorage.setItem("googleOAuthError", error.message);
        setTimeout(() => navigate("/editor"), 5000);
      }
    };

    processAuthCode();
  }, [navigate]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={10}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
          {error}
        </Alert>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="h6" mt={2}>
            Processing Google authorization...
          </Typography>
        </>
      )}

      {error && (
        <Typography variant="body1" mt={2}>
          Redirecting back to editor in a few seconds...
        </Typography>
      )}
    </Box>
  );
};

export default GoogleCallback;
