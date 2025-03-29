import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import { Link } from "react-router-dom";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";

const DraftList = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState(null);
  const { idToken } = useAuth();

  useEffect(() => {
    if (idToken) {
      loadDrafts();
    }
  }, [idToken]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const data = await api.getDrafts(idToken);
      setDrafts(data);
      setError("");
    } catch (err) {
      setError("Failed to load drafts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (draft) => {
    setDraftToDelete(draft);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!draftToDelete) return;

    try {
      await api.deleteDraft(idToken, draftToDelete.id);
      setDrafts(drafts.filter((d) => d.id !== draftToDelete.id));
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
    } catch (err) {
      setError("Failed to delete draft: " + err.message);
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
    <Paper elevation={3} sx={{ padding: 3, maxWidth: 800, margin: "0 auto" }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Your Drafts</Typography>
        <Button
          component={Link}
          to="/editor"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          New Letter
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {drafts.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: "center", py: 4 }}>
          You don't have any drafts yet. Create your first letter!
        </Typography>
      ) : (
        <List>
          {drafts.map((draft) => (
            <ListItem
              key={draft.id}
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    component={Link}
                    to={`/editor/${draft.id}`}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteClick(draft)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                mb: 1,
                "&:hover": { bgcolor: "#f5f5f5" },
              }}
            >
              <ListItemText
                primary={draft.title}
                secondary={`Last updated: ${new Date(
                  draft.updatedAt
                ).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Draft</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{draftToDelete?.title}"? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DraftList;
