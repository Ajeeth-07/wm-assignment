const {google} = require('googleapis');
const {db} = require('../config/firebase');
const {getOAuth2Client} = require('../utils/googleDriveUtil');


//save doc to gdrive
const saveToGoogleDrive = async(req, res) =>{
    try{
        const {title, content} = req.body;
        const userId = req.user.uid;

        const userDoc = await db.collection('users').doc(userId).get();

        if(!userDoc.exists){
            return res.status(400).json({error:'User credentials not found'});
        }

        const userData = userDoc.data();

        if(!userData.tokens){
            return res.status(400).json({error:'Google drive not connected'});
        }

        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials(userData.tokens);

        const drive = google.drive({version:'v3', auth:oauth2Client});

        //Html content for drive
        const htmlContent = `<!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        <title>${title || 'Untitled Letter'}</title>
        </head>
        <body>
            ${content}
        </body>
        </html>
        `;

        //uploading to drive
        const response = await drive.files.create({
            requestBody:{
                name : title || 'Untitled Letter',
                mimeType : 'application/vnd.google-apps.document',
            },
            media: {
                mimeType: 'text/html',
                body:htmlContent
            }
        });

        //save reference file in firestore
        await db.collection('drive_files').add({
            userId,
            fileId : response.data.id,
            title: title || 'Untitled Letter',
            createdAt: new Date().toISOString()
        });

        res.status(200).json({
            success: true,
            fileID : response.data.id
        });
    }catch(error){
        console.error('Error saving to Google Drive:', error);

        //handling token expiration
        if(error.code === 401){
            return res.status(401).json({error:'Google Authorization expired'});
        }

        res.status(500).json({error:error.message});
    }
};


const getGoogleDriveFiles = async(req,res) => {
    try{
        const userId = req.user.uid;

        const userDoc = await db.collection('users').doc(userId).get();

        if(!userDoc.exists || !userDoc.data().tokens){
            return res.status(400).json({error:'Google Drive not connected'});
        }

        const userData = userDoc.data();

        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials(userData.tokens);

        const drive = google.drive({version:'v3', auth:oauth2Client});

        const response = await drive.files.list({
            pageSize:30,
            fields: 'files(id, name, mimeType, webViewLink, createdTime)',
            q:"mimeType='application/vnd.google-apps.document'"
        });

        res.status(200).json(response.data.files);
    }catch(error){
        console.error('Error fetching google drive files:', error);
        res.status(500).json({error:error.message});
    }
};

module.exports = {
    saveToGoogleDrive,
    getGoogleDriveFiles
}