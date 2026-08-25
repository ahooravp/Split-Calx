const express = require('express');
const cors = require('cors');
const verifyToken = require('./middleware/authMiddleware');

// 1. Import our new route files
const authRoutes = require('../src/routes/authRoutes.js');
const appRoutes = require('../src/routes/appRoutes.js');

const app = express();

app.use(cors()); 
app.use(express.json()); 

// 2. Mount the routes (The Traffic Cop)
// Any request starting with /auth goes to authRoutes
app.use('/auth', authRoutes);

// Any request starting with /api goes to appRoutes
app.use('/api',verifyToken, appRoutes);

// Route: Get /
// Purpose: API Health Check
app.get('/', (req, res) => {
    res.status(200).json({ status: "alive", message: "Debt Simplifier API is running!" });
});

// ==========================================
// START SERVER
// ==========================================
// Only start the server manually if we are running it locally
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server is running live on http://localhost:${PORT}`);
    });
}