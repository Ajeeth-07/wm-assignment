const {admin, db} = require('../config/firebase');

//storing OAuth tokens
const storeUserTokens = async(req, res) => {
    try{
        const {uid, tokens} = req.body;
        
        if(!uid || !tokens) return res.status(400).json({error:'Missing required fields'});

        //storing tokens in firestore
        await db.collection('users').doc(uid).set({
            tokens,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, {merge: true});

        res.status(200).hson({success: true});
    }catch(error){
        console.error('Error storing user tokens:', error);
        res.status(500).json({error:error.message});
    }
};

const getUserProfile = async(req, res) => {
    try{
        const uid = req.user.uid;
        const userRecord = await admin.auth().getUser(uid);

        res.status(200).json({
            uid : userRecord.uid,
            email : userRecord.email,
            displayName : userRecord.displayName,
            photoURL : userRecord.photoURL
        });
    }catch(error){
        console.error('Error fetching user profile:', error);
        res.status(500).json({error:error.message});
    }
};

module.exports = {
    storeUserTokens,
    getUserProfile
}