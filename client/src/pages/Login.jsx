import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Paper,
  Typography,
  Box,
  Container,
  CircularProgress,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ padding: 4, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Letter Editor
        </Typography>

        <Typography variant="body1" sx={{ mb: 4 }}>
          A simple app to create, edit and save letters to Google Drive
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGoogleSignIn}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <GoogleIcon />
            }
            sx={{ py: 1.5, px: 4 }}
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
