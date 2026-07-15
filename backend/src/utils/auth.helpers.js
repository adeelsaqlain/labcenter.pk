const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12; // Production-grade

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,             // Display name
      role: user.role,             // SUPER_ADMIN | BRANCH_ADMIN | STAFF
      branch_id: user.branch_id    // null for SUPER_ADMIN
    },
    process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only');
}

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };
