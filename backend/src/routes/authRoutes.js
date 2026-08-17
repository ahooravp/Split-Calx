const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Route: POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required to create a full account." });
        }
        
        const hashedPassword = await bcrypt.hash(password, 8);
        
        const queryText = `
            INSERT INTO users (name, email, password) 
            VALUES ($1, $2, $3) 
            RETURNING id, name, email; 
        `;
        
        const newUser = await pool.query(queryText, [name, email, hashedPassword]);
        const user = newUser.rows[0];

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ token, user }); 
        
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: "An account with this email already exists." });
        }
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

// Route: POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required to login." });
        }

        const queryText = `SELECT * FROM users WHERE email = $1;`;
        const result = await pool.query(queryText, [email]);
        const user = result.rows[0];

        if (!user || !user.password) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const passwordIsValid = await bcrypt.compare(password, user.password);
        
        if (!passwordIsValid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ 
            token, 
            user: { id: user.id, name: user.name, email: user.email } 
        });

    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});


// Route: GET /auth/invite/:token
// Purpose: Fetch basic public info for an invite screen (Unprotected)
router.get('/invite/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const tripResult = await pool.query('SELECT id, name FROM trips WHERE share_token = $1', [token]);
        const trip = tripResult.rows[0];

        if (!trip) return res.status(404).json({ error: "Invalid or expired invite link." });

        const membersResult = await pool.query(`
            SELECT u.id, u.name, u.email 
            FROM users u
            JOIN trip_members tm ON u.id = tm.user_id
            WHERE tm.trip_id = $1
            ORDER BY u.id ASC; 
        `, [trip.id]);

        const members = membersResult.rows;
        const inviter = members.length > 0 ? members[0].name : "A friend";

        res.json({ trip, members, inviter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load invite link" });
    }
});

// Route: POST /auth/claim
router.post('/claim', async (req, res) => {
    try {
        // UPDATED: We now accept the `name` so they can edit it!
        const { userId, name, email, password } = req.body;

        if (!userId || !name || !email || !password) {
            return res.status(400).json({ error: "All fields are required to claim an account." });
        }

        const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: "This email is already registered." });
        }

        const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        const targetUser = userCheck.rows[0];

        if (!targetUser) return res.status(404).json({ error: "User not found." });
        if (targetUser.password) return res.status(400).json({ error: "This account has already been claimed." });

        const hashedPassword = await bcrypt.hash(password, 8);
        
        // UPDATED: We overwrite their dummy name with whatever they typed in the box
        const updateQuery = `
            UPDATE users 
            SET name = $1, email = $2, password = $3 
            WHERE id = $4 
            RETURNING id, name, email;
        `;
        
        const updatedResult = await pool.query(updateQuery, [name, email, hashedPassword, userId]);
        const finalUser = updatedResult.rows[0];

        const token = jwt.sign({ id: finalUser.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: finalUser });

    } catch (error) {
        console.error("Error claiming account:", error);
        res.status(500).json({ error: "Failed to claim account" });
    }
});

module.exports = router;