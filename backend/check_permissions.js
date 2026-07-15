const { pool } = require('./src/config/database');

async function run() {
  const [users] = await pool.query('SELECT id, name, role FROM users');
  console.log('Users:', users);

  const [perms] = await pool.query('SELECT * FROM role_permissions WHERE permission_key = "manage_accounts"');
  console.log('manage_accounts permissions:', perms);

  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
