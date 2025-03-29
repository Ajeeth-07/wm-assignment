import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useNavigate, useParams } from "react-router-dom";
import GoogleDriveAuth from "../Auth/GoogleDriveAuth";

const TextEditor = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { idToken } = useAuth();
  const navigate = useNavigate();
  const { draftId } = useParams();
  const [showReconnectButton, setShowReconnectButton] = useState(null);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  // Load draft if editing existing
  useEffect(() => {
    if (draftId && idToken) {
      setLoading(true);
      api
        .getDraft(idToken, draftId)
        .then((data) => {
          setTitle(data.title);
          setContent(data.content);
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to load draft: " + err.message);
          setLoading(false);
        });
    }
  }, [draftId, idToken]);

  const saveDraft = async () => {
    if (!title) {
      setError("Please enter a title");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (draftId) {
        await api.updateDraft(idToken, draftId, { title, content });
      } else {
        const result = await api.createDraft(idToken, { title, content });
        navigate(`/editor/${result.draftId}`);
      }
      setSaving(false);
    } catch (err) {
      setError("Failed to save draft: " + err.message);
      setSaving(false);
    }
  };

  // Update the saveToGoogleDrive function with better error handling
  const saveToGoogleDrive = async () => {
    if (!title) {
      setError("Please enter a title");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const response = await api.saveToGoogleDrive(idToken, { title, content });
      setUploading(false);
      setSuccess(
        `Successfully saved to Google Drive! ${
          response.viewLink ? `View: ${response.viewLink}` : ""
        }`
      );

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Failed to upload to Google Drive:", err);

      // Handle different error types
      if (err.response?.status === 401) {
        setError("Your Google Drive session has expired. Please reconnect.");
        setShowReconnectButton(true);
      } else if (err.response?.status === 403) {
        setError(
          "Insufficient permissions for Google Drive. Please reconnect with full permissions."
        );
        setShowReconnectButton(true);
      } else if (err.response?.status === 400) {
        setError("Not connected to Google Drive. Please connect first.");
      } else {
        setError(
          "Failed to upload to Google Drive: " +
            (err.response?.data?.error || err.message)
        );
      }
      setUploading(false);
    }
  };

  // Add this function inside your TextEditor component
  const handleReconnectGoogle = async () => {
    try {
      // Clear the error state
      setError("");

      // Redirect to Google auth with force=true to ensure we get fresh permissions
      const redirectUri = window.location.origin + "/auth/google-callback";
      const { url } = await api.getGoogleAuthUrl(redirectUri, true);

      if (url) {
        // Navigate to the auth URL
        window.location.href = url;
      } else {
        setError("Failed to get Google authentication URL");
      }
    } catch (err) {
      setError("Failed to reconnect: " + err.message);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ padding: 3, maxWidth: 1000, margin: "0 auto" }}>
      <Typography variant="h4" gutterBottom>
        {draftId ? "Edit Letter" : "Create New Letter"}
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error" sx={{ mb: showReconnectButton ? 1 : 0 }}>
            {error}
          </Typography>
          {showReconnectButton && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={handleReconnectGoogle}
              sx={{ mt: 1 }}
            >
              Reconnect to Google Drive
            </Button>
          )}
        </Box>
      )}

      {success && (
        <Typography color="success" sx={{ mb: 2 }}>
          {success}
        </Typography>
      )}

      <TextField
        label="Title"
        variant="outlined"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 3 }}
      />

      <ReactQuill
        theme="snow"
        value={content}
        onChange={setContent}
        modules={modules}
        placeholder="Start writing your letter here..."
        style={{ height: "400px", marginBottom: "60px" }}
      />

      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="body2" mr={2}>
          To save to Google Drive:
        </Typography>
        <GoogleDriveAuth />
      </Box>

      <Box display="flex" gap={2} mt={8}>
        <Button
          variant="contained"
          color="primary"
          onClick={saveDraft}
          disabled={saving}
          startIcon={<SaveIcon />}
        >
          {saving ? "Saving..." : "Save Draft"}
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={saveToGoogleDrive}
          disabled={uploading}
          startIcon={<CloudUploadIcon />}
        >
          {uploading ? "Uploading..." : "Save to Google Drive"}
        </Button>
      </Box>
    </Paper>
  );
};

export default TextEditor;
