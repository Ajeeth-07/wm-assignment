const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { admin } = require("../config/firebase");

// This script helps generate a test token for API testing

async function generateTestToken() {
  try {
    // Verify environment variables are loaded
    if (!process.env.FIREBASE_API_KEY || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error(
        "❌ Environment variables not loaded properly. Check your .env file."
      );
      console.log(
        "Required variables: FIREBASE_API_KEY, FIREBASE_PRIVATE_KEY, etc."
      );
      return;
    }

    // Create a test user ID
    const uid = "test-user-123";

    // Generate a custom token
    const customToken = await admin.auth().createCustomToken(uid);
    console.log("✅ Custom Token (for exchange):", customToken);

    console.log("\nInstructions:");
    console.log(
      "1. Use this token to get an ID token by calling the Firebase Auth REST API:"
    );
    console.log(
      `curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}" \\`
    );
    console.log('  -H "Content-Type: application/json" \\');
    console.log(`  -d '{"token":"${customToken}","returnSecureToken":true}'`);
    console.log(
      '\n2. From the response, use the "idToken" value for your API requests'
    );

    // For Postman users
    console.log("\nPostman Request:");
    console.log(
      "POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=" +
        process.env.FIREBASE_API_KEY
    );
    console.log("Headers: Content-Type: application/json");
    console.log(`Body: {"token":"${customToken}","returnSecureToken":true}`);
  } catch (error) {
    console.error("❌ Error generating token:", error);
    console.error("Error details:", error.message);
  }
}

generateTestToken();
