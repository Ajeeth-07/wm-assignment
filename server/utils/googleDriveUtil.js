const { google } = require("googleapis");
const { admin } = require("../config/firebase");

// Define scopes for Google Drive API
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

/**
 * Creates a new OAuth2 client with the provided credentials
 * @param {string} redirectUri - Optional custom redirect URI
 * @returns {OAuth2Client} Google OAuth2 client
 */
const createOAuth2Client = (redirectUri = process.env.GOOGLE_REDIRECT_URI) => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

/**
 * Gets the OAuth2 client for a specific user, or creates a new one
 * @param {string} userId - Firebase user ID
 * @returns {Promise<OAuth2Client|null>} OAuth2 client or null if tokens not found
 */
const getOAuth2Client = async (userId) => {
  try {
    // When called without userId, create a fresh client
    if (!userId) {
      return createOAuth2Client();
    }

    // Get user's tokens from Firestore
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      console.error("User document not found for ID:", userId);
      return null;
    }

    const userData = userDoc.data();

    if (!userData.tokens || !userData.tokens.access_token) {
      console.error("No Google tokens found for user:", userId);
      return null;
    }

    // Create OAuth client
    const oauth2Client = createOAuth2Client();

    // Set credentials
    oauth2Client.setCredentials(userData.tokens);

    // Check if token is expired
    if (
      userData.tokens.expiry_date &&
      userData.tokens.expiry_date < Date.now()
    ) {
      console.log("Token expired, refreshing...");

      if (userData.tokens.refresh_token) {
        // Refresh the token
        const { tokens } = await oauth2Client.refreshAccessToken();

        // Update tokens in Firestore
        await admin.firestore().collection("users").doc(userId).update({
          tokens: tokens,
        });

        // Update credentials with new tokens
        oauth2Client.setCredentials(tokens);
      } else {
        console.error("No refresh token available, user needs to reconnect");
        return null;
      }
    }

    return oauth2Client;
  } catch (error) {
    console.error("Error getting OAuth2 client:", error);
    return null;
  }
};

/**
 * Generate Google Auth URL for OAuth flow
 * @param {string} redirectUri - Optional custom redirect URI
 * @param {boolean} forceConsent - Optional flag to force consent screen
 * @returns {string} Authorization URL
 */
const getGoogleAuthUrl = (
  redirectUri = process.env.GOOGLE_REDIRECT_URI,
  forceConsent = false
) => {
  const oauth2Client = createOAuth2Client(redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    include_granted_scopes: true,
    prompt: forceConsent ? "consent" : undefined, // Force consent if requested
  });

  return authUrl;
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code
 * @param {string} redirectUri - Optional custom redirect URI
 * @returns {Promise<Object>} OAuth tokens
 */
const getTokensFromCode = async (
  code,
  redirectUri = process.env.GOOGLE_REDIRECT_URI
) => {
  try {
    const oauth2Client = createOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error("Error getting tokens from code:", error);
    throw error;
  }
};

/**
 * Get user tokens from Firebase token
 * @param {string} accessToken - Firebase access token
 * @returns {Promise<Object>} OAuth tokens
 */
const getUserTokensFromFirebaseToken = async (accessToken) => {
  try {
    // Create OAuth client
    const oauth2Client = createOAuth2Client();

    // Get user info using the access token
    oauth2Client.setCredentials({ access_token: accessToken });

    // Get a new access token with drive scope
    const { tokens } = await oauth2Client.refreshAccessToken();
    return tokens;
  } catch (error) {
    console.error("Error getting user tokens:", error);
    throw error;
  }
};

module.exports = {
  getOAuth2Client,
  getGoogleAuthUrl,
  getTokensFromCode,
  getUserTokensFromFirebaseToken, // Export the new function
  createOAuth2Client,
};
