import axios from "axios";

// Determine if we're in production
const isProd =
  import.meta.env?.PROD || window.location.hostname !== "localhost";

// Set up API client with the correct base URL
const apiClient = axios.create({
  baseURL: isProd
    ? "https://wm-assignment-backend.onrender.com/api"
    : "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

console.log("API client initialized with baseURL:", apiClient.defaults.baseURL);

// Add auth token to requests
const authRequest = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const api = {
  // Auth endpoints
  getGoogleAuthUrl: async (redirectUri, force = false) => {
    const response = await apiClient.get("/auth/google-auth-url", {
      params: { redirectUri, force: force ? "true" : "false" },
    });
    return response.data;
  },

  getGoogleTokens: async (code, redirectUri) => {
    const response = await apiClient.post("/auth/google-callback", {
      code,
      redirectUri,
    });
    return response;
  },

  getGoogleTokensFromFirebase: async (accessToken) => {
    const response = await apiClient.post("/auth/firebase-token", {
      accessToken,
    });
    return response;
  },

  storeUserTokens: async (uid, tokens) => {
    try {
      const response = await apiClient.post("/auth/firebase-token", {
        uid,
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
      });
      return response.data;
    } catch (error) {
      console.warn("Non-critical error storing tokens:", error);
      return { success: false, error: error.message };
    }
  },

  getUserProfile: async (token) => {
    const response = await apiClient.get("/auth/profile", authRequest(token));
    return response.data;
  },

  checkOAuthStatus: async (token) => {
    try {
      const response = await apiClient.get(
        "/auth/oauth-status",
        authRequest(token)
      );
      return response.data;
    } catch (error) {
      // Handle 404 specifically
      if (error.response && error.response.status === 404) {
        return { status: "not_connected" };
      }
      throw error;
    }
  },

  revokeGoogleTokens: async (uid) => {
    // Since we don't have this endpoint, we'll use a simpler approach
    // that doesn't require additional server endpoints
    return await apiClient.post("/auth/clear-tokens", { uid });
  },

  // Draft endpoints
  getDrafts: async (token) => {
    const response = await apiClient.get("/drafts", authRequest(token));
    return response.data;
  },

  getDraft: async (token, draftId) => {
    const response = await apiClient.get(
      `/drafts/${draftId}`,
      authRequest(token)
    );
    return response.data;
  },

  createDraft: async (token, draft) => {
    const response = await apiClient.post("/drafts", draft, authRequest(token));
    return response.data;
  },

  updateDraft: async (token, draftId, draft) => {
    const response = await apiClient.put(
      `/drafts/${draftId}`,
      draft,
      authRequest(token)
    );
    return response.data;
  },

  deleteDraft: async (token, draftId) => {
    const response = await apiClient.delete(
      `/drafts/${draftId}`,
      authRequest(token)
    );
    return response.data;
  },

  // Google Drive endpoints
  saveToGoogleDrive: async (token, data) => {
    const response = await apiClient.post(
      "/drive/save",
      data,
      authRequest(token)
    );
    return response.data;
  },

  getGoogleDriveFiles: async (token) => {
    const response = await apiClient.get("/drive/files", authRequest(token));
    return response.data;
  },
};

export default api;
