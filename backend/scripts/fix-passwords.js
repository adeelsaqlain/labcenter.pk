require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin123',
    database: 'lab_diagnostic',
  });

  const hash = await bcrypt.hash('password123', 12);
  console.log('Generated hash:', hash);

  await conn.query('UPDATE users SET password_hash = ?', [hash]);
  console.log('✅ All user passwords updated to: password123');

  const [rows] = await conn.query('SELECT id, name, email, role, password_hash FROM users');
  console.table(rows);

  // Quick verify
  const isValid = await bcrypt.compare('password123', hash);
  console.log('✅ Hash verification:', isValid);

  await conn.end();
}

fixPasswords().catch(console.error);
