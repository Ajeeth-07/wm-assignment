const admin = require("firebase-admin");

let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Handle different possible formats of the key
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  // If the key is already wrapped in quotes, parse it
  privateKey = JSON.parse(privateKey);
} else if (privateKey.includes("\\n")) {
  // Replace escaped newlines with actual newlines
  privateKey = privateKey.replace(/\\n/g, "\n");
}

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    databaseURL:
      process.env.FIREBASE_DATABASE_URL ||
      `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
  console.log("Firebase Admin SDK initialized successfully!");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  console.error(
    "Private key format issue? First 20 chars:",
    privateKey.substring(0, 20)
  );
}

module.exports = admin;
