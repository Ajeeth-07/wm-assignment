const express = require("express");
const router = express.Router();
const { admin } = require("../config/firebase");
const {
  storeUserTokens,
  getUserProfile,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  getGoogleAuthUrl,
  getTokensFromCode,
} = require("../utils/googleDriveUtil");

router.post("/tokens", storeUserTokens);

router.get("/profile", verifyToken, getUserProfile);

// Update your google-auth-url endpoint
router.get("/google-auth-url", async (req, res) => {
  try {
    // Always use the environment variable from the server in production
    // This ignores any client-provided redirectUri
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const forceConsent = req.query.force === "true";

    console.log("Using redirect URI for auth URL:", redirectUri);
    console.log("Force consent:", forceConsent);

    const authUrl = getGoogleAuthUrl(redirectUri, forceConsent);
    res.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating Google auth URL:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add or update this route
router.post("/google-callback", async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    console.log("Received code exchange request:");
    console.log("- Code present:", !!code);
    console.log("- Redirect URI:", redirectUri);

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    // Exchange the authorization code for tokens
    const tokens = await getTokensFromCode(code, redirectUri);

    console.log("Tokens received from Google:");
    console.log("- Access token present:", !!tokens.access_token);
    console.log("- Refresh token present:", !!tokens.refresh_token);

    res.json({ success: true, tokens });
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update the firebase-token endpoint
router.post("/firebase-token", async (req, res) => {
  try {
    console.log("Received firebase token store request:", req.body);
    const uid = req.body.uid;
    const accessToken = req.body.accessToken;
    const idToken = req.body.idToken;

    if (!uid) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Create tokens object with whatever we have
    const tokens = {
      access_token: accessToken,
      id_token: idToken,
      expiry_date: Date.now() + 3600000, // 1 hour from now
    };

    console.log(`Storing tokens for user ${uid}`);
    // Store in Firestore
    await admin.firestore().collection("users").doc(uid).set(
      {
        tokens,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error storing Firebase token:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update the oauth-status endpoint
router.get("/oauth-status", verifyToken, async (req, res) => {
  try {
    console.log("Checking OAuth status for user:", req.user.uid);

    // Get user document from Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();

    if (!userDoc.exists) {
      console.log("User document not found for ID:", req.user.uid);
      return res.status(200).json({
        status: "not_connected",
        message: "User not found in database",
      });
    }

    const userData = userDoc.data();
    console.log("Found user data, checking tokens...");

    if (!userData.tokens || !userData.tokens.access_token) {
      console.log("No tokens found for user:", req.user.uid);
      return res.status(200).json({
        status: "not_connected",
        message: "No Google OAuth tokens found",
      });
    }

    // Don't return the actual tokens for security
    console.log("User has valid tokens");
    res.status(200).json({
      status: "connected",
      provider: "google",
      tokenExists: true,
      expiryDate: userData.tokens.expiry_date,
    });
  } catch (error) {
    console.error("OAuth status check error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add this route to debug OAuth setup
router.get("/debug-oauth", (req, res) => {
  try {
    const { createOAuth2Client } = require("../utils/googleDriveUtil");

    // Create test client
    const oauth2Client = createOAuth2Client();

    // Check if it has the required methods
    const hasMethods = {
      generateAuthUrl: typeof oauth2Client.generateAuthUrl === "function",
      getToken: typeof oauth2Client.getToken === "function",
      refreshAccessToken: typeof oauth2Client.refreshAccessToken === "function",
    };

    // Get environment variables (redacted for security)
    const env = {
      clientId: process.env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ Missing",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    };

    res.json({
      oauth2Client: "Initialized",
      hasMethods,
      env,
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Add endpoint to revoke tokens
router.post("/revoke-tokens", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log("Revoking tokens for user:", userId);

    // Delete tokens from Firestore
    await admin.firestore().collection("users").doc(userId).update({
      tokens: admin.firestore.FieldValue.delete(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error revoking tokens:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new endpoint to clear tokens
router.post("/clear-tokens", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log("Clearing tokens for user:", userId);

    // Delete tokens from Firestore
    await admin.firestore().collection("users").doc(userId).update({
      tokens: admin.firestore.FieldValue.delete(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error clearing tokens:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
