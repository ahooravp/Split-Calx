const { Pool } = require('pg');
require('dotenv').config(); // Load the secrets from the .env file

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});


pool.on('error', (err, client) => {
    console.error('⚠️ Unexpected error on idle client:', err.message);
});

pool.connect()
    .then((client) => {
        console.log('📦 Successfully connected to the PostgreSQL database!');
        client.release(); 
    })
    .catch((err) => console.error('❌ Database connection error:', err.stack));

module.exports = pool;