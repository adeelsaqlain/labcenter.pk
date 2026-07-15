require('dotenv').config();
const { pool } = require('./src/config/database');

async function patchProfits() {
  try {
    const [items] = await pool.query(`
      SELECT 
        ii.id as item_id, 
        ii.price, 
        ii.cost_price, 
        ii.booking_profit_pct, 
        ii.performing_profit_pct,
        inv.subtotal,
        inv.total_amount
      FROM invoice_items ii
      JOIN invoices inv ON ii.invoice_id = inv.id
      WHERE ii.is_outsourced = TRUE AND inv.discount_amount > 0
    `);

    let updatedCount = 0;

    for (const item of items) {
      const discountRatio = parseFloat(item.subtotal) > 0 ? (parseFloat(item.total_amount) / parseFloat(item.subtotal)) : 1;
      const discountedPrice = parseFloat(item.price) * discountRatio;
      const profit = discountedPrice - parseFloat(item.cost_price);
      
      let newBookingAmt = 0;
      let newPerformingAmt = 0;

      if (profit > 0) {
        newBookingAmt = profit * (parseFloat(item.booking_profit_pct) / 100);
        newPerformingAmt = profit * (parseFloat(item.performing_profit_pct) / 100);
      }

      // Update invoice_items
      await pool.query(`
        UPDATE invoice_items 
        SET booking_profit_amount = ?, performing_profit_amount = ? 
        WHERE id = ?
      `, [newBookingAmt, newPerformingAmt, item.item_id]);

      // Update commission_settlements (if exists)
      await pool.query(`
        UPDATE commission_settlements 
        SET booking_profit_amount = ?, performing_profit_amount = ? 
        WHERE invoice_item_id = ?
      `, [newBookingAmt, newPerformingAmt, item.item_id]);

      updatedCount++;
    }

    console.log(`Successfully patched ${updatedCount} invoice items and settlements.`);
  } catch (error) {
    console.error('Error patching profits:', error);
  } finally {
    process.exit();
  }
}

patchProfits();
