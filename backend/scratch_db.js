require('dotenv').config();
const { pool } = require('./src/config/database');

async function fixDeadlock() {
  try {
    console.log("Checking MySQL process list...");
    const [rows] = await pool.query('SHOW PROCESSLIST');
    console.table(rows);
    
    // Kill processes that are sleeping for a long time or locking
    for (const row of rows) {
      if (row.Command === 'Sleep' && row.Time > 60) {
        console.log(`Killing sleeping process ${row.Id}`);
        await pool.query(`KILL ${row.Id}`);
      }
    }
    console.log("Done checking processes.");
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

fixDeadlock();
