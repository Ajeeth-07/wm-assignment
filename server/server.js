const express = require("express");
const cors = require("cors");
require("dotenv").config();

//routes
const authRoutes = require("./routes/authRoutes");
const draftRoutes = require("./routes/draftRoutes");
const driveRoutes = require("./routes/driveRoutes");

//firebase admin
require("./config/firebase");

const app = express();

// Debug environment variables on startup
console.log("======= ENVIRONMENT VARIABLES =======");
console.log(`PORT: ${process.env.PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI}`);
console.log("====================================");

//middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://accounts.google.com",
      // Add your production frontend URL here
      "https://your-frontend-url.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Add this before your API routes setup
// Handle Google OAuth callback directly at the root path
app.get("/auth/google-callback", (req, res) => {
  const code = req.query.code;
  const redirectUri = req.query.state; // If you passed state param with redirectUri

  console.log(
    "Received Google callback with code:",
    code ? "present" : "missing"
  );

  // Create an HTML page to handle the redirect with JavaScript
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Processing Google Auth...</title>
      <script>
        // Function to handle the callback on the client side
        function handleCallback() {
          const code = "${code}";
          const redirectUri = "${process.env.GOOGLE_REDIRECT_URI}";
          
          // Store the auth code in localStorage
          localStorage.setItem('googleAuthCode', code);
          
          // Redirect back to the frontend
          window.location.href = "${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/auth-callback";
        }
        
        // Execute when page loads
        window.onload = handleCallback;
      </script>
    </head>
    <body>
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <h2>Processing your Google authorization...</h2>
          <p>Please wait while we complete the authentication process.</p>
          <p>If you're not redirected automatically, <a href="${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/auth-callback">click here</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Add this before setting up the main routes
// Debug routes
app.get("/api/debug/env", (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || "not set",
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    firebaseProject: process.env.FIREBASE_PROJECT_ID,
    hasFirebaseKey: !!process.env.FIREBASE_PRIVATE_KEY,
    privateKeyStart: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.substring(0, 30) + "..."
      : "not set",
  });
});

//routes
app.use("/api/auth", authRoutes);
app.use("/api/drafts", draftRoutes);
app.use("/api/drive", driveRoutes);

// Add a simple health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

//error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
