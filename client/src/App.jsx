import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Box, CssBaseline } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/Layout/Header";
import Login from "./pages/Login";
import DraftList from "./components/Drafts/DraftList";
import TextEditor from "./components/Editor/TextEditor";
import GoogleCallback from "./components/Auth/GoogleCallback";
import AuthCallback from "./components/Auth/AuthCallback";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return null;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <CssBaseline />
      <Header />

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DraftList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <TextEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="/editor/:draftId"
            element={
              <ProtectedRoute>
                <TextEditor />
              </ProtectedRoute>
            }
          />

          <Route path="/auth/google-callback" element={<GoogleCallback />} />
          <Route path="/auth-callback" element={<AuthCallback />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
