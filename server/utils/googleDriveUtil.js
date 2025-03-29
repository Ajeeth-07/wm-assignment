const {google} = require('googleapis');

const getOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
};

const getGoogleAuthUrl = () => {
    const oauth2Client = getOAuth2Client();

    const scopes = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });
};

const getTokensFromCode = async(code) => {
    const oauth2Client = getOAuth2Client();
    const {tokens} = await oauth2Client.getToken(code);
    return tokens;
};

module.exports = {
    getOAuth2Client,
    getGoogleAuthUrl,
    getTokensFromCode
}