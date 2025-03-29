const { admin } = require("../config/firebase");

const verifyToken = async (req, res, next) => {
  try {
    // Debug information
    console.log("📝 Auth Debug Info:");
    console.log("- Headers present:", Object.keys(req.headers));
    console.log(
      "- Authorization header:",
      req.headers.authorization ? "Present" : "Missing"
    );

    // Check for header case sensitivity (common issue)
    const authHeader =
      req.headers.authorization ||
      req.headers.Authorization ||
      req.get("authorization") ||
      req.get("Authorization");

    console.log(
      "- Using header value:",
      authHeader || "None found with any case"
    );

    // Extract token
    const idToken = authHeader?.split("Bearer ")[1];

    console.log(
      "- Extracted token:",
      idToken ? `${idToken.substring(0, 10)}...` : "None"
    );

    if (!idToken) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify token
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log("- Token verified for user:", decodedToken.uid);
      req.user = decodedToken;
      next();
    } catch (verifyError) {
      console.error("- Token verification failed:", verifyError.message);
      return res
        .status(401)
        .json({ error: `Invalid token: ${verifyError.message}` });
    }
  } catch (error) {
    console.error("Error in auth middleware:", error);
    res.status(500).json({ error: "Server error during authentication" });
  }
};

module.exports = { verifyToken };
