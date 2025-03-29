const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { admin } = require("../config/firebase");

// This script helps generate a test token for API testing

async function generateTestToken() {
  try {
    // Check environment variables
    if (!process.env.FIREBASE_API_KEY) {
      console.error("❌ FIREBASE_API_KEY is missing in .env file");
      return;
    }

    // Create a test user ID
    const uid = "test-user-123";

    // Generate a custom token
    const customToken = await admin.auth().createCustomToken(uid);

    // Create full JSON body for easy copy-paste
    const jsonBody = JSON.stringify(
      {
        token: customToken,
        returnSecureToken: true,
      },
      null,
      2
    );

    console.log("\n✅ STEP 1: Copy this ENTIRE code block for Postman:");
    console.log("------------------------------------------------------");
    console.log(jsonBody);
    console.log("------------------------------------------------------");

    console.log("\n✅ STEP 2: Send this request in Postman:");
    console.log(
      `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`
    );
    console.log("Content-Type: application/json");

    console.log("\n✅ STEP 3: From the response, copy the 'idToken' value");
  } catch (error) {
    console.error("❌ Error generating token:", error);
    console.error("Error details:", error.message);
  }
}

generateTestToken();
