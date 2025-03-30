const admin = require("firebase-admin");

// Function to format the private key properly
function formatPrivateKey(key) {
  if (!key) return "";

  // Handle different key formats
  if (key.startsWith('"') && key.endsWith('"')) {
    // Handle double-quoted key
    key = JSON.parse(key);
  } else if (key.includes("\\n")) {
    // Replace escaped newlines with actual newlines
    key = key.replace(/\\n/g, "\n");
  }

  return key;
}

// Format the private key
const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

// For debugging
console.log("Firebase initialization:");
console.log(`- Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
console.log(`- Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
console.log(`- Private Key valid: ${privateKey.includes("BEGIN PRIVATE KEY")}`);

try {
  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });

  console.log("✅ Firebase Admin SDK initialized successfully!");

  // Initialize Firestore
  const db = admin.firestore();
  console.log("✅ Firestore initialized");

  // Export both admin and db
  module.exports = { admin, db };
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error);
  // Still export admin to prevent crashes
  module.exports = {
    admin,
    db: { collection: () => ({ get: () => Promise.resolve([]) }) }, // Mock DB for graceful failure
  };
}
