const { admin, db } = require("../config/firebase");

//storing OAuth tokens
const storeUserTokens = async (req, res) => {
  try {
    const { uid, tokens } = req.body;

    if (!uid || !tokens)
      return res.status(400).json({ error: "Missing required fields" });

    //storing tokens in firestore
    await db.collection("users").doc(uid).set(
      {
        tokens,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.status(200).json({ success: true });
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
