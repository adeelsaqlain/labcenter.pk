const { pool } = require('../../config/database');
const { generateToken, comparePassword } = require('../../utils/auth.helpers');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, branch_id, referring_doctor_id, name, role, password_hash, is_active FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let permissions = [];
    if (user.role === 'SUPER_ADMIN') {
      permissions = ['SUPER_ADMIN_ALL'];
    } else {
      const [permRows] = await pool.query('SELECT permission_key FROM role_permissions WHERE role_name = ? AND is_allowed = TRUE', [user.role]);
      permissions = permRows.map(r => r.permission_key);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      name: user.name,
      role: user.role,
      branch_id: user.branch_id,
      referring_doctor_id: user.referring_doctor_id,
      permissions
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        branch_id: user.branch_id,
        referring_doctor_id: user.referring_doctor_id,
        permissions
      }
    });

  } catch (error) {
    next(error);
  }
}

// TODO: Implement OTP registration/verification
// function registerViaOtp(...) {}

function getMe(req, res) {
  // req.user is already populated and fresh from the `authenticate` middleware
  res.json({ success: true, user: req.user });
}

module.exports = {
  login,
  getMe
};
