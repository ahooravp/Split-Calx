const pool = require('./db');

async function viewData() {
    try {
        console.log("\n👤 --- USERS TABLE ---");
        // We leave out the password column so we don't print messy hashes!
        const users = await pool.query('SELECT id, name, email FROM users;');
        console.table(users.rows);

        console.log("\n✈️ --- TRIPS TABLE ---");
        const trips = await pool.query('SELECT * FROM trips;');
        console.table(trips.rows);

        console.log("\n🧾 --- EXPENSES TABLE ---");
        const expenses = await pool.query('SELECT * FROM expenses;');
        console.table(expenses.rows);

        console.log("\n🍕 --- EXPENSE SPLITS TABLE ---");
        const splits = await pool.query('SELECT * FROM expense_splits;');
        console.table(splits.rows);

    } catch (error) {
        console.error("❌ Error fetching data:", error);
    } finally {
        // Hang up the connection so the script finishes
        pool.end(); 
    }
}

// Run the function
viewData();