const express = require("express");
const router = express.Router();
const {saveToGoogleDrive, getGoogleDriveFiles} = require("../controllers/driveController");
const {verifyToken} = require("../middleware/authMiddleware");

router.use(verifyToken);

router.post('/save', saveToGoogleDrive);

router.get('/files', getGoogleDriveFiles);

module.exports = router;