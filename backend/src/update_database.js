const pool = require('./db'); 

async function updateTable() {
    try {
        console.log('⏳ Adding password column to users table...');

        // This is the exact SQL command to add the missing column
        const queryText = `ALTER TABLE users ADD COLUMN password VARCHAR(255);`;

        await pool.query(queryText);
        
        console.log('✅ Success! The password column has been added.');
    } catch (error) {
        console.error('❌ Error updating table:', error);
    } finally {
        // We hang up the connection so the script finishes and exits
        pool.end(); 
    }
}

// Run the function
updateTable();