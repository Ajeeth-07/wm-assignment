const { google } = require("googleapis");
const { db } = require("../config/firebase");
const { getOAuth2Client } = require("../utils/googleDriveUtil");

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

//save doc to gdrive
const saveToGoogleDrive = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.uid;

    console.log("Saving to Drive: User ID:", userId);

    // Get OAuth2 client
    const oauth2Client = await getOAuth2Client(userId);
    if (!oauth2Client) {
      return res.status(400).json({
        error:
          "Google OAuth tokens not found. Please authenticate with Google first.",
      });
    }

    console.log("OAuth client created successfully for user:", userId);

    // Create Drive client
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Prepare file content
    const fileContent = content;
    const fileName = `${title}.html`;

    try {
      // First, try to create the file
      console.log("Creating file in Google Drive:", fileName);

      const fileMetadata = {
        name: fileName,
        mimeType: "text/html",
      };

      const media = {
        mimeType: "text/html",
        body: fileContent,
      };

      // Create the file
      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id,name,webViewLink",
      });

      console.log("File created successfully:", file.data);

      // Grant read permission to anyone with the link
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      console.log("Permissions set for file:", file.data.id);

      res.status(200).json({
        message: "Successfully saved to Google Drive",
        fileId: file.data.id,
        fileName: file.data.name,
        viewLink: file.data.webViewLink,
      });
    } catch (driveError) {
      console.error("Drive API error:", driveError);

      // Check for token expiry or permission issues
      if (driveError.status === 401) {
        // Token expired, try to refresh
        try {
          console.log("Refreshing expired token...");
          await oauth2Client.refreshAccessToken();
          return res.status(401).json({
            error: "Authentication expired. Please reconnect to Google Drive.",
          });
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
          return res.status(401).json({
            error: "Authentication expired. Please reconnect to Google Drive.",
          });
        }
      } else if (driveError.status === 403) {
        // Permission issue
        return res.status(403).json({
          error: "Insufficient permission to save to Google Drive.",
          details:
            "Please reconnect to Google Drive with the correct permissions.",
          scopes: SCOPES.join(", "),
        });
      }

      throw driveError; // Let the outer catch handle other errors
    }
  } catch (error) {
    console.error("Error saving to Google Drive:", error);
    res.status(500).json({ error: error.message });
  }
};

const getGoogleDriveFiles = async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists || !userDoc.data().tokens) {
      return res.status(400).json({ error: "Google Drive not connected" });
    }

    const userData = userDoc.data();

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(userData.tokens);

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const response = await drive.files.list({
      pageSize: 30,
      fields: "files(id, name, mimeType, webViewLink, createdTime)",
      q: "mimeType='application/vnd.google-apps.document'",
    });

    res.status(200).json(response.data.files);
  } catch (error) {
    console.error("Error fetching google drive files:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  saveToGoogleDrive,
  getGoogleDriveFiles,
};
