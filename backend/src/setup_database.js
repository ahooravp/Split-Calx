const pool = require('./db'); // Import our open phone lines!

async function createTables() {
    try {
        console.log('⏳ Building tables...');

        const queryText = `
            -- 1. USERS
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL
            );

            -- 2. TRIPS
            CREATE TABLE IF NOT EXISTS trips (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 3. TRIP MEMBERS
            CREATE TABLE IF NOT EXISTS trip_members (
                trip_id INT REFERENCES trips(id),
                user_id INT REFERENCES users(id),
                PRIMARY KEY (trip_id, user_id)
            );

            -- 4. EXPENSES
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                trip_id INT REFERENCES trips(id),
                payer_id INT REFERENCES users(id),
                description VARCHAR(255) NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 5. EXPENSE SPLITS
            CREATE TABLE IF NOT EXISTS expense_splits (
                expense_id INT REFERENCES expenses(id),
                user_id INT REFERENCES users(id),
                amount_owed DECIMAL(10, 2) NOT NULL,
                PRIMARY KEY (expense_id, user_id)
            );
        `;

        // Send the instruction down the phone line
        await pool.query(queryText);
        
        console.log('✅ Success! All database tables have been created.');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
    } finally {
        // Hang up the phone lines so the script can finish and exit
        pool.end(); 
    }
}

// Run the function
createTables();