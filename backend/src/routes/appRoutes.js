// src/routes/appRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getNetBalances, simplifyDebts } = require('../utils/algorithm');

// ==========================================
// TRIP READ OPERATIONS
// ==========================================

// Route: GET /api/trips
// Purpose: Fetch all trips the logged-in user belongs to
router.get('/trips', async (req, res) => {
    try {
        const loggedInUserId = req.user.id;

        const query = `
            SELECT t.* 
            FROM trips t
            JOIN trip_members tm ON t.id = tm.trip_id
            WHERE tm.user_id = $1
            ORDER BY t.created_at DESC;
        `;

        const { rows } = await pool.query(query, [loggedInUserId]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching trips:", error);
        res.status(500).json({ error: "Failed to fetch trips" });
    }
});

// Route: GET /api/trips/:trip_id
// Purpose: Fetch details for a specific trip, ONLY if the user is a member
router.get('/trips/:trip_id', async (req, res) => {
    try {
        const { trip_id } = req.params;
        const loggedInUserId = req.user.id;

        const query = `
            SELECT t.* 
            FROM trips t
            JOIN trip_members tm ON t.id = tm.trip_id
            WHERE t.id = $1 AND tm.user_id = $2; 
        `;

        const { rows } = await pool.query(query, [trip_id, loggedInUserId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching single trip:", error);
        res.status(500).json({ error: "Failed to fetch trip details" });
    }
});

// ==========================================
// ROUTE: DELETE /api/trips/:trip_id
// PURPOSE: Permanently delete a trip (OWNERS ONLY)
// ==========================================
router.delete('/trips/:trip_id', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { trip_id } = req.params;
        const loggedInUserId = req.user.id;

        // 1. STRICT GATEKEEPER: Fetch the trip to check ownership
        const authCheck = await client.query(
            'SELECT created_by FROM trips WHERE id = $1', 
            [trip_id]
        );
        
        // If the trip doesn't exist, return a 404
        if (authCheck.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: "Trip not found." });
        }

        // If the requester is not the creator, return a 403
        if (authCheck.rows[0].created_by !== loggedInUserId) {
            client.release();
            return res.status(403).json({ error: "Access denied. Only the trip creator can delete this trip." });
        }

        // 2. START HEAVY DELETION TRANSACTION
        await client.query('BEGIN');

        await client.query(`
            DELETE FROM expense_splits 
            WHERE expense_id IN (
                SELECT id FROM expenses WHERE trip_id = $1
            );
        `, [trip_id]);

        await client.query(
            'DELETE FROM expenses WHERE trip_id = $1;', 
            [trip_id]
        );

        await client.query(
            'DELETE FROM trip_members WHERE trip_id = $1;', 
            [trip_id]
        );

        await client.query(
            'DELETE FROM trips WHERE id = $1;', 
            [trip_id]
        );

        // 3. COMMIT EXECUTIONS
        await client.query('COMMIT');
        res.json({ message: "Trip and all associated data successfully deleted." });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error deleting trip:", error);
        res.status(500).json({ error: "Failed to delete trip. Please try again." });
    } finally {
        if (client) client.release();
    }
});


// ==========================================
// TRIP WRITE OPERATIONS
// ==========================================

// Route: POST /api/trips
// Purpose: Create a new trip and assign the creator as the owner
router.post('/trips', async (req, res) => {
    const client = await pool.connect();
    try {
        const { name } = req.body;
        const loggedInUserId = req.user.id; 

        await client.query('BEGIN');

        // Insert the loggedInUserId into the created_by column
        const tripResult = await client.query(
            `INSERT INTO trips (name, created_by) VALUES ($1, $2) RETURNING *;`,
            [name, loggedInUserId]
        );
        const newTrip = tripResult.rows[0];

        // The creator is still added to the guest list so they show up in expense splits
        await client.query(
            `INSERT INTO trip_members (trip_id, user_id) VALUES ($1, $2);`,
            [newTrip.id, loggedInUserId] 
        );

        await client.query('COMMIT');
        res.json(newTrip);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error creating trip:", error);
        res.status(500).json({ error: "Failed to create trip" });
    } finally {
        client.release();
    }
});

// Route: POST /api/trips/join
// Purpose: Join a trip using a share token
router.post('/trips/join', async (req, res) => {
    try {
        const { token } = req.body;
        const loggedInUserId = req.user.id; 

        const tripResult = await pool.query('SELECT id, name FROM trips WHERE share_token = $1', [token]);
        const trip = tripResult.rows[0];

        if (!trip) return res.status(404).json({ error: "Invalid link" });

        await pool.query(
            `INSERT INTO trip_members (trip_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
            [trip.id, loggedInUserId] 
        );

        res.json(trip);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to join trip" });
    }
});

// Route: GET /api/trips/invite/:token
// Purpose: Fetch basic public info for an invite screen (No membership required)
router.get('/trips/invite/:token', async (req, res) => {
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


// ==========================================
// MEMBER OPERATIONS
// ==========================================

// Route: GET /api/trips/:trip_id/members
// Purpose: Fetch all members of a trip
router.get('/trips/:trip_id/members', async (req, res) => {
    try {
        const { trip_id } = req.params;
        const loggedInUserId = req.user.id;

        // Gatekeeper
        const authCheck = await pool.query('SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2', [trip_id, loggedInUserId]);
        if (authCheck.rows.length === 0) return res.status(403).json({ error: "Access denied." });

        const query = `
            SELECT u.id, u.name, u.email 
            FROM users u
            JOIN trip_members tm ON u.id = tm.user_id
            WHERE tm.trip_id = $1;
        `;
        const { rows } = await pool.query(query, [trip_id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch members" });
    }
});

// Route: POST /api/trips/:trip_id/members
// Purpose: Add a new (dummy or real) user to a trip
router.post('/trips/:trip_id/members', async (req, res) => {
    const client = await pool.connect();
    try {
        const { trip_id } = req.params;
        const { name, email } = req.body;
        const loggedInUserId = req.user.id;

        // Gatekeeper
        const authCheck = await client.query('SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2', [trip_id, loggedInUserId]);
        if (authCheck.rows.length === 0) {
            client.release();
            return res.status(403).json({ error: "You cannot add members to a trip you are not part of." });
        }

        if (!name) {
            client.release();
            return res.status(400).json({ error: "A name is required to add a member." });
        }

        await client.query('BEGIN');
        let userToAdd;

        if (email) {
            const userResult = await client.query(`SELECT id, name FROM users WHERE email = $1;`, [email]);
            if (userResult.rows.length > 0) {
                userToAdd = userResult.rows[0];
            } else {
                const newUserResult = await client.query(
                    `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name;`,
                    [name, email]
                );
                userToAdd = newUserResult.rows[0];
            }
        } else {
            const newUserResult = await client.query(
                `INSERT INTO users (name) VALUES ($1) RETURNING id, name;`,
                [name]
            );
            userToAdd = newUserResult.rows[0];
        }

        await client.query(
            `INSERT INTO trip_members (trip_id, user_id) VALUES ($1, $2);`,
            [trip_id, userToAdd.id]
        );

        await client.query('COMMIT');
        res.json({ message: `${userToAdd.name} was added to the trip!`, user: userToAdd });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') {
            return res.status(400).json({ error: "This user is already on the trip!" });
        }
        res.status(500).json({ error: "Failed to add member" });
    } finally {
        if (client) client.release();
    }
});


// ==========================================
// EXPENSE & SETTLEMENT OPERATIONS
// ==========================================

// Route: POST /api/expenses
// Purpose: Log a new expense and its splits
router.post('/expenses', async (req, res) => {
    const client = await pool.connect();
    try {
        const { trip_id, payer_id, description, total_amount, splits } = req.body;
        const loggedInUserId = req.user.id;

        // 1. Gatekeeper Check
        const authCheck = await client.query('SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2', [trip_id, loggedInUserId]);
        if (authCheck.rows.length === 0) {
            client.release();
            return res.status(403).json({ error: "You cannot add expenses to a trip you are not part of." });
        }

        // 2. Data Integrity Validation: Ensure all involved users belong to the trip
        const involvedUserIds = [payer_id, ...splits.map(s => s.user_id)];
        const uniqueUserIds = [...new Set(involvedUserIds)];

        const validationQuery = `
            SELECT COUNT(*) 
            FROM trip_members 
            WHERE trip_id = $1 AND user_id = ANY($2::int[])
        `;
        const validationResult = await client.query(validationQuery, [trip_id, uniqueUserIds]);
        
        if (parseInt(validationResult.rows[0].count) !== uniqueUserIds.length) {
            client.release();
            return res.status(400).json({ error: "One or more users in this expense do not belong to this trip." });
        }

        await client.query('BEGIN');

        const expenseResult = await client.query(
            `INSERT INTO expenses (trip_id, payer_id, description, total_amount) VALUES ($1, $2, $3, $4) RETURNING id;`,
            [trip_id, payer_id, description, total_amount]
        );
        const newExpenseId = expenseResult.rows[0].id;

        for (let split of splits) {
            await client.query(
                `INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES ($1, $2, $3);`,
                [newExpenseId, split.user_id, split.amount]
            );
        }
        await client.query('COMMIT');
        res.status(201).json({ message: "Expense and splits saved successfully!", expenseId: newExpenseId });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: "Failed to add expense" });
    } finally {
        if (client) client.release();
    }
});

// ROUTE: GET /api/trips/:trip_id/expenses 
// Purpose: Fetch the chronological receipt ledger for a trip
router.get('/trips/:trip_id/expenses', async (req, res) => {
    try {
        const { trip_id } = req.params;
        const loggedInUserId = req.user.id;

        // Gatekeeper
        const authCheck = await pool.query('SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2', [trip_id, loggedInUserId]);
        if (authCheck.rows.length === 0) return res.status(403).json({ error: "Access denied." });

        const query = `
            SELECT e.id, e.description, e.total_amount, e.created_at, u.name as payer_name
            FROM expenses e
            JOIN users u ON e.payer_id = u.id
            WHERE e.trip_id = $1
            ORDER BY e.created_at DESC;
        `;
        const { rows } = await pool.query(query, [trip_id]);
        res.json(rows);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
});

// Route: GET /api/trips/:trip_id/settle
// Purpose: Calculate net balances and generate optimal settlement transactions
router.get('/trips/:trip_id/settle', async (req, res) => {
    try {
        const { trip_id } = req.params;
        const loggedInUserId = req.user.id;

        // Gatekeeper
        const authCheck = await pool.query('SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2', [trip_id, loggedInUserId]);
        if (authCheck.rows.length === 0) return res.status(403).json({ error: "Access denied." });

        const query = `
            SELECT e.id AS expense_id, e.payer_id, e.total_amount,
                   es.user_id AS borrower_id, es.amount_owed
            FROM expenses e
            JOIN expense_splits es ON e.id = es.expense_id
            WHERE e.trip_id = $1;
        `;
        const { rows } = await pool.query(query, [trip_id]);

        const expensesMap = {};
        rows.forEach(row => {
            if (!expensesMap[row.expense_id]) {
                expensesMap[row.expense_id] = { payerId: row.payer_id, totalAmount: Number(row.total_amount), splits: [] };
            }
            expensesMap[row.expense_id].splits.push({ userId: row.borrower_id, amountOwed: Number(row.amount_owed) });
        });

        const balances = getNetBalances(Object.values(expensesMap));
        res.json({ message: "Trip settled!", netBalances: balances, transactions: simplifyDebts(balances) });
    } catch (error) {
        res.status(500).json({ error: "Failed to calculate settlement" });
    }
});

module.exports = router;