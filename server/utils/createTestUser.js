const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { admin } = require("../config/firebase");

async function createTestUser() {
  try {
    // Check if test user already exists
    try {
      const userRecord = await admin.auth().getUser("test-user-123");
      console.log("✅ Test user already exists:", userRecord.uid);
    } catch (error) {
      // User doesn't exist, create it
      const userRecord = await admin.auth().createUser({
        uid: "test-user-123",
        email: "testuser@example.com",
        password: "testpassword123",
        displayName: "Test User",
      });
      console.log("✅ Created new test user:", userRecord.uid);
    }

    // Generate custom token for this user
    const customToken = await admin.auth().createCustomToken("test-user-123");

    console.log(
      "\n✅ STEP 1: Copy this ID token exchange request for Postman:"
    );
    console.log("-----------------------------------------------------------");
    console.log(
      `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`
    );
    console.log("Content-Type: application/json");
    console.log("\nBody:");
    console.log(
      JSON.stringify(
        {
          token: customToken,
          returnSecureToken: true,
        },
        null,
        2
      )
    );
    console.log("-----------------------------------------------------------");

    console.log(
      "\n✅ STEP 2: From the response, copy the 'idToken' value for your API requests"
    );
  } catch (error) {
    console.error("❌ Error creating test user:", error);
  }
}

createTestUser();
