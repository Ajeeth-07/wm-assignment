const {admin} = require('../config/firebase')

const verifyToken = async(req, res, next) => {
    try{
        const idToken = req.headers.authorization?.split('Bearer ')[1];

        if(!idToken){
            return res.status(401).json({error: 'Unauthorized: No token provided'});
        }

        const decodedToken = await admin.auth().verifyToken(idToken);
        req.user = decodedToken;
        next();
    }catch(error){
        console.error('Error verifying token:', error);
        res.status(401).json({error:'Unauthorized: Invalid token'});
    }
};

module.exports = {verifyToken};