const { pool } = require('../../config/database');

// Ensure the table has the new columns added from the UI
async function ensureSettingsColumns() {
  try {
    // We add the columns if they don't exist
    const columns = [
      "ALTER TABLE global_settings ADD COLUMN master_email VARCHAR(100);",
      "ALTER TABLE global_settings ADD COLUMN master_phone VARCHAR(50);",
      "ALTER TABLE global_settings ADD COLUMN head_office_address TEXT;",
      "ALTER TABLE global_settings ADD COLUMN global_report_footer_text TEXT;",
      "ALTER TABLE global_settings ADD COLUMN logo_base64 LONGTEXT;"
    ];
    for (let q of columns) {
      try {
        await pool.query(q);
      } catch (e) {
        // Ignore duplicate column errors
        if (e.code !== 'ER_DUP_FIELDNAME') {
          console.error("Column add error:", e);
        }
      }
    }
  } catch (error) {
    console.error("Ensure columns error:", error);
  }
}

// Fire and forget column check
ensureSettingsColumns();

async function getSettings(req, res, next) {
  try {
    // Ensure the single row exists
    let [rows] = await pool.query('SELECT * FROM global_settings WHERE id = 1');
    
    if (rows.length === 0) {
      // Insert default row
      await pool.query('INSERT IGNORE INTO global_settings (id, app_name, currency) VALUES (1, "Lab Diagnostic Center", "PKR")');
      [rows] = await pool.query('SELECT * FROM global_settings WHERE id = 1');
    }
    
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
}

// Public endpoint — only returns safe non-sensitive fields (no auth needed)
async function getPublicSettings(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT app_name, logo_base64 FROM global_settings WHERE id = 1 LIMIT 1');
    const data = rows[0] || { app_name: 'Lab Diagnostic Center', logo_base64: '' };
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { 
      app_name, 
      currency, 
      master_email, 
      master_phone, 
      head_office_address, 
      global_report_footer_text, 
      logo_base64 
    } = req.body;

    const query = `
      UPDATE global_settings 
      SET 
        app_name = ?, 
        currency = ?, 
        master_email = ?, 
        master_phone = ?, 
        head_office_address = ?, 
        global_report_footer_text = ?, 
        logo_base64 = ?
      WHERE id = 1
    `;

    const params = [
      app_name || 'Lab Diagnostic Center',
      currency || 'PKR',
      master_email || '',
      master_phone || '',
      head_office_address || '',
      global_report_footer_text || '',
      logo_base64 || ''
    ];

    await pool.query(query, params);
    
    // Fetch and return the updated row
    const [rows] = await pool.query('SELECT * FROM global_settings WHERE id = 1');
    res.json({ success: true, message: 'Settings updated successfully', data: rows[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  getPublicSettings,
  updateSettings
};
