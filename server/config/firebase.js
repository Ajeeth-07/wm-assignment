const admin = require("firebase-admin");

// Update how you retrieve the private key
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
let formattedKey = privateKey;

// Handle different key formats
if (privateKey.startsWith('"') || privateKey.startsWith("'")) {
  // If the key is already quoted in the environment variable
  formattedKey = JSON.parse(privateKey);
} else if (privateKey.startsWith("{")) {
  // If the key is stored as a JSON object
  try {
    const keyObject = JSON.parse(privateKey);
    formattedKey = keyObject.privateKey;
  } catch (e) {
    // In case parsing fails
    formattedKey = privateKey.replace(/\\n/g, "\n");
  }
} else {
  // Default handling
  formattedKey = privateKey.replace(/\\n/g, "\n");
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: formattedKey,
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

module.exports = { admin, db };
