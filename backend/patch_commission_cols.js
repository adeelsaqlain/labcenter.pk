require('dotenv').config();
const { pool } = require('./src/config/database');

async function patchCommissionCols() {
  try {
    const [items] = await pool.query(`
      SELECT 
        cs.invoice_item_id,
        ii.price as test_rate,
        inv.subtotal,
        inv.total_amount
      FROM commission_settlements cs
      JOIN invoice_items ii ON cs.invoice_item_id = ii.id
      JOIN invoices inv ON ii.invoice_id = inv.id
    `);

    let updatedCount = 0;

    for (const item of items) {
      const discountRatio = parseFloat(item.subtotal) > 0 ? (parseFloat(item.total_amount) / parseFloat(item.subtotal)) : 1;
      const discountedPrice = parseFloat(item.test_rate) * discountRatio;
      let discountPercentage = 0;
      if (parseFloat(item.test_rate) > 0) {
         discountPercentage = ((parseFloat(item.test_rate) - discountedPrice) / parseFloat(item.test_rate)) * 100;
      }

      await pool.query(`
        UPDATE commission_settlements 
        SET test_rate = ?, discount_percentage = ?, discounted_price = ?
        WHERE invoice_item_id = ?
      `, [item.test_rate, discountPercentage, discountedPrice, item.invoice_item_id]);

      updatedCount++;
    }

    console.log(`Successfully patched ${updatedCount} commission settlements.`);
  } catch (error) {
    console.error('Error patching cols:', error);
  } finally {
    process.exit();
  }
}

patchCommissionCols();
