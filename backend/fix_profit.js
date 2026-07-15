const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function fix() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lab_diagnostic',
  });

  const [items] = await pool.query(`
    SELECT 
      ii.id, ii.invoice_id, ii.test_id, ii.price, ii.cost_price, ii.booking_profit_pct, ii.performing_profit_pct,
      inv.discount_percent, inv.referring_doctor_id,
      rd.commission_percent, rd.commission_category
    FROM invoice_items ii
    JOIN invoices inv ON ii.invoice_id = inv.id
    LEFT JOIN referring_doctors rd ON inv.referring_doctor_id = rd.id
    WHERE ii.is_outsourced = TRUE
  `);
  
  let updated = 0;
  for (const item of items) {
    const invDiscountPct = parseFloat(item.discount_percent) || 0;
    const grossTestPrice = parseFloat(item.price) || 0;
    const netTestPrice = grossTestPrice * (1 - invDiscountPct / 100);
    const costPrice = parseFloat(item.cost_price) || 0;
    
    let testDoctorComm = 0;
    if (item.referring_doctor_id && item.commission_percent) {
      const commPct = parseFloat(item.commission_percent) || 0;
      const category = item.commission_category || 'ON_TEST_RATE';
      
      if (category === 'ON_TEST_RATE') {
        testDoctorComm = netTestPrice * commPct / 100;
      } else {
        testDoctorComm = Math.max(0, netTestPrice - costPrice) * commPct / 100;
      }
    }
    
    const profit = netTestPrice - costPrice - testDoctorComm;
    
    let bookingAmount = 0;
    let performingAmount = 0;
    if (profit > 0) {
       bookingAmount = profit * (item.booking_profit_pct / 100);
       performingAmount = profit * (item.performing_profit_pct / 100);
    }
    
    await pool.query(
      'UPDATE invoice_items SET booking_profit_amount = ?, performing_profit_amount = ? WHERE id = ?',
      [bookingAmount, performingAmount, item.id]
    );
    updated++;
  }
  
  // Now sync into commission_settlements
  const [csItems] = await pool.query('SELECT id, invoice_item_id FROM commission_settlements');
  for (const cs of csItems) {
    const [iiRows] = await pool.query('SELECT booking_profit_amount, performing_profit_amount FROM invoice_items WHERE id = ?', [cs.invoice_item_id]);
    if (iiRows.length > 0) {
      await pool.query('UPDATE commission_settlements SET booking_profit_amount = ?, performing_profit_amount = ? WHERE id = ?', 
        [iiRows[0].booking_profit_amount, iiRows[0].performing_profit_amount, cs.id]);
    }
  }
  
  console.log('Fixed historical profit logic for ' + updated + ' outsourced tests.');
  process.exit(0);
}

fix().catch(console.error);
