const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// === Security & Parsing ===
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// === Routes ===
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/roles', require('./modules/auth/roles.routes'));
app.use('/api/branches', require('./modules/branches/branch.routes'));
app.use('/api/users', require('./modules/users/user.routes'));
app.use('/api/tests', require('./modules/tests/test.routes'));
app.use('/api/patients', require('./modules/patients/patient.routes'));
app.use('/api/billing', require('./modules/billing/billing.routes'));
app.use('/api/dispatches', require('./modules/billing/dispatch.routes'));
app.use('/api/salary', require('./modules/salary/salary.routes'));
app.use('/api/expenses', require('./modules/expense/expense.routes'));
app.use('/api/settings', require('./modules/settings/settings.routes'));
app.use('/api/commissions', require('./modules/commission/commission.routes'));
app.use('/api/doctor-commissions', require('./modules/commission/doctor-commission.routes'));
app.use('/api/doctors', require('./modules/doctors/doctors.routes'));

// === Health Check ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === Global Error Handler ===
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

module.exports = app;
