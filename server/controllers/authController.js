const { admin, db } = require("../config/firebase");

//storing OAuth tokens
const storeUserTokens = async (req, res) => {
  try {
    const { uid, tokens } = req.body;

    console.log("Storing tokens for user:", uid);
    console.log("- Access token present:", !!tokens.access_token);
    console.log("- Refresh token present:", !!tokens.refresh_token);

    if (!uid || !tokens) {
      return res.status(400).json({ error: "User ID and tokens are required" });
    }

    // Verify the database connection first
    const { db } = require("../config/firebase");
    if (!db || !db.collection) {
      throw new Error("Firestore not properly initialized");
    }

    // Store the tokens in Firestore
    await db.collection("users").doc(uid).set(
      {
        tokens: tokens,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("Tokens stored successfully for user:", uid);

    res.json({ success: true });
  } catch (error) {
    console.error("Error storing user tokens:", error);
    res.status(500).json({ error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    console.log("Fetching profile for user:", req.user.uid);

    // Check if admin auth is available
    if (!admin || !admin.auth) {
      throw new Error("Firebase Admin not properly initialized");
    }

    // Get user from Firebase
    const userRecord = await admin.auth().getUser(req.user.uid);

    // Get additional user data from Firestore if needed
    let userData = {};
    try {
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      if (userDoc.exists) {
        userData = userDoc.data();
      }
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      // Continue with basic user info even if Firestore fails
    }

    // Return user profile
    res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || req.user.name || "",
      photoURL: userRecord.photoURL || req.user.picture || "",
      // Add more fields from userData if needed
      ...userData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      error: "Failed to fetch user profile",
      details: error.message,
    });
  }
};

module.exports = {
  storeUserTokens,
  getUserProfile,
};
