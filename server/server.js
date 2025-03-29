const express = require("express");
const cors = require("cors");
require('dotenv').config();

//routes
 const authRoutes = require('./routes/authRoutes');
 const draftRoutes = require('./routes/draftRoutes');
 const driveRoutes = require('./routes/driveRoutes');


//firebase admin
require('./config/firebase');

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//routes
app.use('/api/auth', authRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/drive', driveRoutes);

//error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        error : err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})