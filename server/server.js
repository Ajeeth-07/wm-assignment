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
      // Add your production frontend URL here
      "https://your-frontend-url.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Add this before setting up the main routes
// Debug routes
app.get("/debug/env", (req, res) => {
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

// Add this after your routes but before app.listen()
// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
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
