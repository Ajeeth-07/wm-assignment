const admin = require("../config/firebase");

const verifyToken = async (req, res, next) => {
  console.log("📝 Auth Debug Info:");
  console.log("- Headers present:", Object.keys(req.headers));

  // Try multiple ways to get the authorization header
  const authHeader =
    req.headers.authorization ||
    req.headers.Authorization ||
    req.get("authorization");

  if (!authHeader) {
    console.log("- No Authorization header found");
    return res.status(401).json({ error: "No authorization token provided" });
  }

  console.log("- Authorization header:", authHeader.substring(0, 15) + "...");

  try {
    // Extract the token from the Authorization header
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      console.log("- No token found in header");
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log("- Token verified for user:", uid);

    // Set user info on request object
    req.user = {
      uid,
      email: decodedToken.email,
      name: decodedToken.name || "",
      picture: decodedToken.picture || "",
    };

    next();
  } catch (error) {
    console.error("🔥 Auth Error:", error.message);
    console.error("Error code:", error.code);
    console.error("Error details:", error);

    return res.status(401).json({
      error: "Authentication failed",
      details: error.message,
    });
  }
};

module.exports = { verifyToken };
