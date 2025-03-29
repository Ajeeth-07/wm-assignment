const express = require("express");
const router = express.Router();
const {storeUserTokens, getUserProfile} = require('../controllers/authController');
const {verifyToken} = require("../middleware/authMiddleware");
const{getGoogleAuthUrl, getTokensFromCode} = require("../utils/googleDriveUtil");

router.post('/tokens', storeUserTokens);

router.get('/profile', verifyToken, getUserProfile);

router.get('/google-auth-url', (req, res) => {
    const url = getGoogleAuthUrl();
    res.json({url});
})

router.post('/google-callback', async(req, res) => {
    try{
        const {code} = req.body;
        const tokens = await getTokensFromCode(code);
        res.json({tokens});
    }catch(error){
        console.error('Error exchanging auth code:', error);
        res.status(500).json({error:error.message});
    }
});

module.exports = router;