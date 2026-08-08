// 1. Import the 'Pool' from the pg library
const { Pool } = require('pg');
require('dotenv').config(); // Load the secrets from the .env file

// 2. Create a new connection pool
// A "Pool" handles multiple connections at once, which is great for scaling.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// 3. Test the connection
pool.connect()
    .then(() => console.log('📦 Successfully connected to the PostgreSQL database!'))
    .catch((err) => console.error('❌ Database connection error:', err.stack));

// 4. Export the pool so other files can use it to query the database
module.exports = pool;