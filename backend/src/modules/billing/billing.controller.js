const { pool } = require('../../config/database');
const jwt = require('jsonwebtoken');

async function ensureBillingTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        branch_id INT NULL,
        patient_id INT NOT NULL,
        subtotal DECIMAL(10,2) DEFAULT 0,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) DEFAULT 0,
        amount_paid DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50),
        pin_code VARCHAR(10) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      )
    `);

    // Ensure pin_code exists if table was already created
    try {
      await pool.query('ALTER TABLE invoices ADD COLUMN pin_code VARCHAR(10) NULL AFTER payment_method');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error('Error adding pin_code:', e);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        test_id INT NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        status ENUM('PENDING_SAMPLE', 'RESULTS_ENTERED', 'APPROVED', 'REJECTED') DEFAULT 'PENDING_SAMPLE',
        approved_by VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_item_id INT NOT NULL,
        parameter_id INT NOT NULL,
        value VARCHAR(255),
        entered_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_item_id) REFERENCES invoice_items(id) ON DELETE CASCADE,
        FOREIGN KEY (parameter_id) REFERENCES parameter_library(id) ON DELETE CASCADE,
        FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
  } catch (error) {
    console.error("Billing tables creation error:", error);
  }
}
ensureBillingTables();

// ================= INVOICES =================

async function createInvoice(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { patient_id, branch_id, subtotal, discount_percent, discount_amount, total_amount, amount_paid, payment_method, tests, referring_doctor_id } = req.body;
    
    if (!patient_id || !tests || tests.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one test are required' });
    }

    const finalBranchId = req.user.role === 'SUPER_ADMIN' ? (branch_id || null) : req.user.branch_id;
    const invoiceNumber = 'INV-' + Date.now();
    const pinCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN

    // Calculate doctor commission & patient discount if a referring doctor is selected
    let doctorCommissionAmount = 0;
    let doctorDiscountAmount = 0;

    let doctorRows = [];
    if (referring_doctor_id) {
      [doctorRows] = await connection.query(
        'SELECT commission_category, commission_percent, patient_discount_percent FROM referring_doctors WHERE id = ? AND is_active = 1',
        [referring_doctor_id]
      );
      if (doctorRows.length > 0) {
        const doc = doctorRows[0];
        const commPct = parseFloat(doc.commission_percent) || 0;
        const discPct = parseFloat(doc.patient_discount_percent) || 0;
        const category = doc.commission_category || 'ON_TEST_RATE';

        if (category === 'ON_TEST_RATE') {
          // Commission based on NET test rate (after discount)
          // Gross Subtotal = sum of all test prices. 
          // Discount Amount is the total discount given to the patient on this invoice.
          // Net Rate = Gross - Discount
          const grossSubtotal = parseFloat(subtotal) || 0;
          const invoiceDiscount = parseFloat(discount_amount) || 0;
          const netSubtotal = Math.max(0, grossSubtotal - invoiceDiscount);
          
          doctorCommissionAmount = Math.round((netSubtotal * commPct / 100) * 100) / 100;
          doctorDiscountAmount   = invoiceDiscount; // just tracking what discount was given
        } else {
          // ON_TEST_PROFIT — calculate per-test profit after discount
          // Since discount_percent applies to the whole invoice, we can apply the discount_percent to each test's rate to get its net rate.
          const invDiscountPct = parseFloat(discount_percent) || 0;
          let totalProfit = 0;
          
          for (const test of tests) {
            const [cfgRows] = await connection.query(
              'SELECT cost_price FROM branch_test_config WHERE branch_id = ? AND test_id = ?',
              [finalBranchId, test.id]
            );
            const costPrice = cfgRows.length > 0 ? (parseFloat(cfgRows[0].cost_price) || 0) : 0;
            const grossTestPrice = parseFloat(test.price) || 0;
            const netTestPrice = grossTestPrice * (1 - invDiscountPct / 100);
            
            const testProfit = Math.max(0, netTestPrice - costPrice);
            totalProfit += testProfit;
          }
          
          doctorCommissionAmount = Math.round((totalProfit * commPct / 100) * 100) / 100;
          doctorDiscountAmount   = parseFloat(discount_amount) || 0;
        }
      }
    }

    const [invResult] = await connection.query(
      `INSERT INTO invoices (invoice_number, branch_id, patient_id, referring_doctor_id, doctor_commission_amount, doctor_discount_amount, subtotal, discount_percent, discount_amount, total_amount, amount_paid, payment_method, pin_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceNumber, finalBranchId, patient_id, referring_doctor_id || null, doctorCommissionAmount, doctorDiscountAmount, subtotal, discount_percent, discount_amount, total_amount, amount_paid, payment_method, pinCode]
    );

    const invoiceId = invResult.insertId;

    const invDiscountPct = parseFloat(discount_percent) || 0;

    for (const test of tests) {
      // Fetch branch test config to determine outsourcing & pricing logic
      const [configRows] = await connection.query(
        'SELECT * FROM branch_test_config WHERE branch_id = ? AND test_id = ?',
        [finalBranchId, test.id]
      );
      
      let isOutsourced = false;
      let performBranchId = finalBranchId;
      let costPrice = 0;
      let bookingPct = 0;
      let performingPct = 0;
      let bookingAmount = 0;
      let performingAmount = 0;

      if (configRows.length > 0) {
        const config = configRows[0];
        costPrice = config.cost_price;
        if (config.perform_mode === 'OUTSOURCED') {
          isOutsourced = true;
          performBranchId = config.default_source_branch_id;
          bookingPct = config.booking_branch_profit_pct;
          performingPct = config.performing_branch_profit_pct;
          
          const grossTestPrice = parseFloat(test.price) || 0;
          const netTestPrice = grossTestPrice * (1 - invDiscountPct / 100);
          
          let testDoctorComm = 0;
          if (referring_doctor_id && doctorRows && doctorRows.length > 0) {
            const doc = doctorRows[0];
            const commPct = parseFloat(doc.commission_percent) || 0;
            const category = doc.commission_category || 'ON_TEST_RATE';
            
            if (category === 'ON_TEST_RATE') {
              testDoctorComm = netTestPrice * commPct / 100;
            } else {
              testDoctorComm = Math.max(0, netTestPrice - parseFloat(costPrice)) * commPct / 100;
            }
          }
          
          const profit = netTestPrice - parseFloat(costPrice) - testDoctorComm;
          
          if (profit > 0) {
            bookingAmount = profit * (bookingPct / 100);
            performingAmount = profit * (performingPct / 100);
          }
        }
      }

      await connection.query(
        `INSERT INTO invoice_items 
         (invoice_id, test_id, price, status, is_outsourced, perform_branch_id, cost_price, booking_profit_pct, performing_profit_pct, booking_profit_amount, performing_profit_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [invoiceId, test.id, test.price, 'PENDING_SAMPLE', isOutsourced, performBranchId, costPrice, bookingPct, performingPct, bookingAmount, performingAmount]
      );
    }

    // Fetch branch info to return (including parent branch for footer)
    const [branchRows] = await connection.query('SELECT * FROM branches WHERE id = ?', [finalBranchId]);
    const branchInfo = branchRows.length > 0 ? branchRows[0] : null;

    let parentBranchInfo = null;
    if (branchInfo && branchInfo.parent_id) {
      const [parentRows] = await connection.query('SELECT * FROM branches WHERE id = ?', [branchInfo.parent_id]);
      parentBranchInfo = parentRows.length > 0 ? parentRows[0] : null;
    }

    // Fetch patient code (MR No)
    const [patientRows] = await connection.query('SELECT patient_code FROM patients WHERE id = ?', [patient_id]);
    const patientCode = patientRows.length > 0 ? patientRows[0].patient_code : null;

    // Generate secure tracking token
    const trackingToken = jwt.sign(
      { invoice_id: invoiceId, invoice_number: invoiceNumber, pin_code: pinCode },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '365d' }
    );

    await connection.commit();
    res.status(201).json({ 
      success: true, 
      data: { 
        id: invoiceId, 
        invoice_number: invoiceNumber,
        branch: branchInfo,
        parent_branch: parentBranchInfo,
        pin_code: pinCode,
        patient_code: patientCode,
        tracking_token: trackingToken
      } 
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function getInvoices(req, res, next) {
  try {
    let query = `
      SELECT i.*, 
             p.name as patient_name, p.phone as patient_phone, p.patient_code,
             b.id as branch_id_col, b.name as branch_name, b.city as branch_city, 
             b.address as branch_address, b.phone as branch_phone, 
             b.receipt_mode as branch_receipt_mode, b.logo as branch_logo,
             b.parent_id as branch_parent_id,
             rd.name as referred_doctor_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN referring_doctors rd ON i.referring_doctor_id = rd.id
    `;
    
    let whereClauses = [];
    let params = [];

    const { target_branch_id, search_mode, start_date, end_date, search } = req.query;

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push('(i.invoice_number LIKE ? OR p.name LIKE ? OR p.phone LIKE ? OR p.patient_code LIKE ?)');
      params.push(term, term, term, term);
    }

    if (start_date && end_date) {
      whereClauses.push('DATE(i.created_at) BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      if (search_mode === 'family' && req.user.branch_family_ids && req.user.branch_family_ids.length > 0) {
        whereClauses.push('i.branch_id IN (?)');
        params.push(req.user.branch_family_ids);
      } else if (target_branch_id === 'all' && req.user.is_parent_branch && req.user.branch_family_ids && req.user.branch_family_ids.length > 0) {
        whereClauses.push('i.branch_id IN (?)');
        params.push(req.user.branch_family_ids);
      } else if (target_branch_id && req.user.branch_family_ids && req.user.branch_family_ids.includes(parseInt(target_branch_id, 10))) {
        whereClauses.push('i.branch_id = ?');
        params.push(parseInt(target_branch_id, 10));
      } else {
        whereClauses.push('i.branch_id = ?');
        params.push(req.user.branch_id);
      }
    } else {
      if (target_branch_id && target_branch_id !== 'all') {
        whereClauses.push('i.branch_id = ?');
        params.push(parseInt(target_branch_id, 10));
      }
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' ORDER BY i.created_at DESC';

    const [rows] = await pool.query(query, params);

    // Fetch items for these invoices to populate receipts properly
    if (rows.length > 0) {
      const invoiceIds = rows.map(r => r.id);
      const [itemsRows] = await pool.query(`
        SELECT ii.invoice_id, ii.test_id, ii.price, t.name as test_name 
        FROM invoice_items ii 
        JOIN tests t ON ii.test_id = t.id 
        WHERE ii.invoice_id IN (?)
      `, [invoiceIds]);
      
      const itemsMap = {};
      itemsRows.forEach(item => {
        if (!itemsMap[item.invoice_id]) itemsMap[item.invoice_id] = [];
        itemsMap[item.invoice_id].push({ name: item.test_name, price: Number(item.price) || 0 });
      });
      
      rows.forEach(row => {
        row.items = itemsMap[row.id] || [];
      });

      // Fetch parent branches for invoices that have a branch with a parent
      const parentIds = [...new Set(rows.filter(r => r.branch_parent_id).map(r => r.branch_parent_id))];
      let parentMap = {};
      if (parentIds.length > 0) {
        const [parentRows] = await pool.query(
          'SELECT id, name, city, address, phone, logo FROM branches WHERE id IN (?)',
          [parentIds]
        );
        parentRows.forEach(p => { parentMap[p.id] = p; });
      }
      rows.forEach(row => {
        if (row.branch_parent_id && parentMap[row.branch_parent_id]) {
          row.parent_branch = parentMap[row.branch_parent_id];
        } else {
          row.parent_branch = null;
        }
      });
      // Generate a fresh tracking token for each invoice
      rows.forEach(row => {
        row.tracking_token = jwt.sign(
          { invoice_id: row.id, invoice_number: row.invoice_number, pin_code: row.pin_code },
          process.env.JWT_SECRET || 'fallback_secret',
          { expiresIn: '365d' }
        );
      });
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

// ================= TEST EXECUTION (DASHBOARDS) =================

async function getInvoiceItemsByStatus(req, res, next) {
  try {
    const { status } = req.query; // e.g. 'PENDING_SAMPLE', 'RESULTS_ENTERED'
    
    let query = `
      SELECT ii.*, i.invoice_number, i.branch_id, p.name as patient_name, t.name as test_name, t.test_code,
             d.dispatch_number, b.name as booking_branch_name
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN patients p ON i.patient_id = p.id
      JOIN tests t ON ii.test_id = t.id
      LEFT JOIN test_dispatches d ON ii.dispatch_id = d.id
      LEFT JOIN branches b ON i.branch_id = b.id
      WHERE ii.status = ?
    `;
    let params = [status];

    if (req.user.role !== 'SUPER_ADMIN') {
      if (status === 'APPROVED' || status === 'RESULTS_ENTERED') {
        if (req.user.branch_family_ids && req.user.branch_family_ids.length > 0) {
          query += ` AND (ii.perform_branch_id IN (?) OR i.branch_id IN (?))`;
          params.push(req.user.branch_family_ids, req.user.branch_family_ids);
        } else {
          query += ` AND (ii.perform_branch_id = ? OR i.branch_id = ?)`;
          params.push(req.user.branch_id, req.user.branch_id);
        }
      } else {
        // Lab techs should only see tests assigned to their branch
        // If it's outsourced, they should only see it if it's been RECEIVED
        query += ` 
          AND ii.perform_branch_id = ? 
          AND (ii.is_outsourced = FALSE OR (ii.is_outsourced = TRUE AND d.status IN ('RECEIVED', 'IN_PROGRESS', 'COMPLETED')))
        `;
        params.push(req.user.branch_id);
      }
    }

    query += ' ORDER BY ii.created_at ASC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function getTestStats(req, res, next) {
  try {
    let baseWhere = '1=1';
    let params = [];

    if (req.user.role !== 'SUPER_ADMIN') {
      if (req.user.branch_family_ids && req.user.branch_family_ids.length > 0) {
        baseWhere = 'i.branch_id IN (?)';
        params.push(req.user.branch_family_ids);
      } else {
        baseWhere = 'i.branch_id = ?';
        params.push(-1);
      }
    }

    const query = `
      SELECT 
        SUM(CASE WHEN ii.status = 'PENDING_SAMPLE' THEN 1 ELSE 0 END) as pending_total,
        SUM(CASE WHEN ii.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_total,
        SUM(CASE WHEN ii.status = 'RESULTS_ENTERED' THEN 1 ELSE 0 END) as pending_review_total,
        SUM(CASE WHEN ii.status = 'RESULTS_ENTERED' AND DATE(ii.updated_at) = CURDATE() THEN 1 ELSE 0 END) as tested_today,
        SUM(CASE WHEN ii.status = 'APPROVED' AND DATE(ii.updated_at) = CURDATE() THEN 1 ELSE 0 END) as approved_today
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE ${baseWhere}
    `;

    const [rows] = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      data: {
        pendingTotal: parseInt(rows[0].pending_total) || 0,
        rejectedTotal: parseInt(rows[0].rejected_total) || 0,
        pendingReviewTotal: parseInt(rows[0].pending_review_total) || 0,
        testedToday: parseInt(rows[0].tested_today) || 0,
        approvedToday: parseInt(rows[0].approved_today) || 0,
      } 
    });
  } catch (error) {
    next(error);
  }
}

async function getDashboardStats(req, res, next) {
  try {
    const { startDate, endDate, target_branch_id } = req.query;
    
    // Default to today if no dates provided
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    let baseWhereInvoices = 'DATE(created_at) BETWEEN ? AND ?';
    let baseWhereItems = 'DATE(created_at) BETWEEN ? AND ?';
    let baseWhereItemsUpdate = 'DATE(updated_at) BETWEEN ? AND ?';
    
    let params = [start, end];

    // Branch filtering
    let branchWhere = '';
    let branchParams = [];

    if (req.user.role !== 'SUPER_ADMIN') {
      if (target_branch_id && target_branch_id !== 'own' && target_branch_id !== 'all') {
         // Specific child branch selected
         branchWhere = ' AND branch_id = ?';
         branchParams.push(target_branch_id);
      } else if (target_branch_id === 'all' && req.user.branch_family_ids && req.user.branch_family_ids.length > 0) {
         branchWhere = ' AND branch_id IN (?)';
         branchParams.push(req.user.branch_family_ids);
      } else {
         // 'own' or fallback
         branchWhere = ' AND branch_id = ?';
         branchParams.push(req.user.branch_id || -1);
      }
    } else if (target_branch_id && target_branch_id !== 'all') {
       branchWhere = ' AND branch_id = ?';
       branchParams.push(target_branch_id);
    }

    // 1. Total Patients (from invoices in date range)
    const [patientRows] = await pool.query(
      `SELECT COUNT(DISTINCT patient_id) as total FROM invoices WHERE ${baseWhereInvoices}${branchWhere}`,
      [...params, ...branchParams]
    );
    const totalPatients = parseInt(patientRows[0].total) || 0;

    // 2. Revenue (from invoices in date range — use total_amount which is the net bill after discount)
    const [revenueRows] = await pool.query(
      `SELECT SUM(total_amount) as total FROM invoices WHERE ${baseWhereInvoices}${branchWhere}`,
      [...params, ...branchParams]
    );
    const totalRevenue = parseFloat(revenueRows[0].total) || 0;

    // 3. Tests Booked / Pending
    // Need a join for invoice_items to filter by branch
    const itemsJoinWhere = `
      FROM invoice_items ii 
      JOIN invoices i ON ii.invoice_id = i.id 
      WHERE DATE(ii.created_at) BETWEEN ? AND ? ${branchWhere.replace(/branch_id/g, 'i.branch_id')}
    `;
    const [bookedRows] = await pool.query(
      `SELECT COUNT(*) as total ${itemsJoinWhere}`,
      [...params, ...branchParams]
    );
    const testsBooked = parseInt(bookedRows[0].total) || 0;

    const [pendingRows] = await pool.query(
      `SELECT COUNT(*) as total ${itemsJoinWhere} AND ii.status IN ('PENDING_SAMPLE', 'REJECTED')`,
      [...params, ...branchParams]
    );
    const pendingReports = parseInt(pendingRows[0].total) || 0;

    // 4. Tests Completed (using updated_at)
    const itemsUpdateJoinWhere = `
      FROM invoice_items ii 
      JOIN invoices i ON ii.invoice_id = i.id 
      WHERE DATE(ii.updated_at) BETWEEN ? AND ? ${branchWhere.replace(/branch_id/g, 'i.branch_id')}
    `;
    const [completedRows] = await pool.query(
      `SELECT COUNT(*) as total ${itemsUpdateJoinWhere} AND ii.status IN ('RESULTS_ENTERED', 'APPROVED')`,
      [...params, ...branchParams]
    );
    const testsCompleted = parseInt(completedRows[0].total) || 0;

    // 5. Chart Data (Group by date)
    const [revenueChartRows] = await pool.query(
      `SELECT DATE(created_at) as day, SUM(total_amount) as revenue 
       FROM invoices WHERE ${baseWhereInvoices}${branchWhere} 
       GROUP BY DATE(created_at) ORDER BY day ASC`,
      [...params, ...branchParams]
    );

    const [testsChartRows] = await pool.query(
      `SELECT DATE(ii.created_at) as day, COUNT(*) as tests 
       ${itemsJoinWhere}
       GROUP BY DATE(ii.created_at) ORDER BY day ASC`,
      [...params, ...branchParams]
    );

    // Merge chart data
    const chartMap = new Map();
    revenueChartRows.forEach(r => {
      // format date as YYYY-MM-DD
      const dateStr = new Date(r.day).toISOString().split('T')[0];
      chartMap.set(dateStr, { day: dateStr, revenue: parseFloat(r.revenue) || 0, tests: 0 });
    });
    testsChartRows.forEach(r => {
      const dateStr = new Date(r.day).toISOString().split('T')[0];
      if (chartMap.has(dateStr)) {
        chartMap.get(dateStr).tests = parseInt(r.tests) || 0;
      } else {
        chartMap.set(dateStr, { day: dateStr, revenue: 0, tests: parseInt(r.tests) || 0 });
      }
    });

    const chartData = Array.from(chartMap.values()).sort((a, b) => a.day.localeCompare(b.day));

    // Optional: Format the 'day' string nicely for frontend (e.g., 'Mon', 'Tue' or 'Nov 12')
    const formattedChartData = chartData.map(d => {
      const dateObj = new Date(d.day);
      return {
        ...d,
        // Short format like '12 Nov'
        formattedDay: dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      };
    });

    res.json({
      success: true,
      data: {
        totalPatients,
        totalRevenue,
        testsBooked,
        testsCompleted,
        pendingReports,
        chartData: formattedChartData
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getTestItemDetails(req, res, next) {
  try {
    const { itemId } = req.params;
    
    // Get item info with comprehensive details for report printing
    const [itemRows] = await pool.query(`
      SELECT 
        ii.*, 
        i.invoice_number, 
        i.pin_code,
        i.branch_id,
        i.created_at as invoice_date,
        p.name as patient_name, 
        p.age as patient_age, 
        p.gender as patient_gender, 
        p.phone as patient_phone,
        t.name as test_name,
        b.name as branch_name,
        b.address as branch_address,
        b.phone as branch_phone,
        b.parent_id as branch_parent_id
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN patients p ON i.patient_id = p.id
      JOIN tests t ON ii.test_id = t.id
      LEFT JOIN branches b ON i.branch_id = b.id
      WHERE ii.id = ?
    `, [itemId]);

    if (itemRows.length === 0) return res.status(404).json({ success: false, message: 'Item not found' });
    const item = itemRows[0];

    // Generate tracking token
    item.tracking_token = jwt.sign(
      { invoice_id: item.invoice_id, invoice_number: item.invoice_number, pin_code: item.pin_code },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '365d' }
    );

    // Get expected parameters
    const [params] = await pool.query(`
      SELECT tp.parameter_name, tp.unit, tp.reference_range_male, tp.reference_range_female, pl.id as parameter_id
      FROM test_parameters tp
      LEFT JOIN parameter_library pl ON tp.parameter_name = pl.parameter_name
      WHERE tp.test_id = ?
      ORDER BY tp.sort_order ASC, tp.id ASC
    `, [item.test_id]);

    // Get any entered results from the JSON column
    const results = item.results_data ? (typeof item.results_data === 'string' ? JSON.parse(item.results_data) : item.results_data) : [];

    res.json({ success: true, data: { item, parameters: params, results } });
  } catch (error) {
    next(error);
  }
}

async function getItemsByInvoice(req, res, next) {
  try {
    const { invoiceId } = req.params;

    const [itemRows] = await pool.query(`
      SELECT 
        ii.*, 
        i.invoice_number,
        i.pin_code,
        i.branch_id,
        i.created_at as invoice_date,
        p.name as patient_name, 
        p.age as patient_age, 
        p.gender as patient_gender, 
        p.phone as patient_phone,
        t.name as test_name,
        b.name as branch_name,
        b.address as branch_address,
        b.phone as branch_phone,
        b.parent_id as branch_parent_id,
        rd.name as referred_doctor_name
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN patients p ON i.patient_id = p.id
      JOIN tests t ON ii.test_id = t.id
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN referring_doctors rd ON i.referring_doctor_id = rd.id
      WHERE ii.invoice_id = ? AND ii.status = 'APPROVED'
      ORDER BY ii.id ASC
    `, [invoiceId]);

    const enrichedItems = [];
    for (const item of itemRows) {
      const [params] = await pool.query(`
        SELECT tp.parameter_name, tp.unit, tp.reference_range_male, tp.reference_range_female, pl.id as parameter_id
        FROM test_parameters tp
        LEFT JOIN parameter_library pl ON tp.parameter_name = pl.parameter_name
        WHERE tp.test_id = ?
        ORDER BY tp.sort_order ASC, tp.id ASC
      `, [item.test_id]);

      const results = item.results_data ? (typeof item.results_data === 'string' ? JSON.parse(item.results_data) : item.results_data) : [];
      
      // Generate tracking token
      item.tracking_token = jwt.sign(
        { invoice_id: item.invoice_id, invoice_number: item.invoice_number, pin_code: item.pin_code },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '365d' }
      );
      
      enrichedItems.push({ item, parameters: params, results });
    }

    res.json({ success: true, data: enrichedItems });
  } catch (error) {
    next(error);
  }
}

async function submitTestResults(req, res, next) {
  try {
    const { itemId } = req.params;
    const { results, remarks } = req.body; // Array of { parameter_id, parameter_name, value, unit, reference_range } and optional string

    // Store results as JSON in invoice_items.results_data
    const resultsJson = results && results.length > 0 ? JSON.stringify(results) : null;

    // Use CURRENT_TIMESTAMP to ensure updated_at is correctly set for stats tracking
    await pool.query(
      'UPDATE invoice_items SET status = ?, results_data = ?, result_remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['RESULTS_ENTERED', resultsJson, remarks || null, itemId]
    );

    res.json({ success: true, message: 'Results submitted successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateTestStatus(req, res, next) {
  try {
    const { itemId } = req.params;
    const { status, remarks } = req.body; // 'APPROVED' or 'REJECTED', and optional remarks
    
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const approvedBy = status === 'APPROVED' ? (req.user?.name || 'Pathologist') : null;
    
    if (status === 'APPROVED' && remarks !== undefined) {
      await pool.query('UPDATE invoice_items SET status = ?, approved_by = ?, result_remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, approvedBy, remarks || null, itemId]);
    } else {
      await pool.query('UPDATE invoice_items SET status = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, approvedBy, itemId]);
    }
    
    res.json({ success: true, message: `Test ${status.toLowerCase()} successfully` });
  } catch (error) {
    next(error);
  }
}

// ================= PUBLIC TRACKING =================

async function generateTrackToken(req, res, next) {
  try {
    const { mr_number, pin_code } = req.body;
    
    // Find patient by MR No
    const [patients] = await pool.query('SELECT id FROM patients WHERE patient_code = ?', [mr_number]);
    if (patients.length === 0) return res.status(404).json({ success: false, message: 'Invalid MR Number or PIN' });
    
    // Find latest invoice for this patient with this PIN
    const [invoices] = await pool.query('SELECT id, invoice_number, pin_code FROM invoices WHERE patient_id = ? AND pin_code = ? ORDER BY created_at DESC LIMIT 1', [patients[0].id, pin_code]);
    if (invoices.length === 0) return res.status(404).json({ success: false, message: 'Invalid MR Number or PIN' });
    
    const invoice = invoices[0];
    const trackingToken = jwt.sign(
      { invoice_id: invoice.id, invoice_number: invoice.invoice_number, pin_code: invoice.pin_code },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '365d' }
    );
    
    res.json({ success: true, tracking_token: trackingToken });
  } catch (error) {
    next(error);
  }
}

async function getTrackInvoiceByToken(req, res, next) {
  try {
    const { token } = req.params;
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired tracking link' });
    }
    
    const invoiceId = decoded.invoice_id;
    
    // Fetch Invoice + Patient details
    const [invRows] = await pool.query(`
      SELECT i.*, p.name as patient_name, p.phone as patient_phone, p.patient_code as mr_number, p.age as patient_age, p.gender as patient_gender,
             b.name as branch_name, b.address as branch_address, b.phone as branch_phone,
             rd.name as referred_doctor_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN referring_doctors rd ON i.referring_doctor_id = rd.id
      WHERE i.id = ?
    `, [invoiceId]);
    
    if (invRows.length === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const invoiceInfo = invRows[0];
    
    // Fetch Items + Dispatch + Parameters + Results
    const [itemRows] = await pool.query(`
      SELECT ii.*, t.name as test_name, 
             d.dispatch_number, d.status as dispatch_status, d.created_at as dispatch_date,
             fb.name as from_branch_name, tb.name as to_branch_name
      FROM invoice_items ii
      JOIN tests t ON ii.test_id = t.id
      LEFT JOIN test_dispatches d ON ii.dispatch_id = d.id
      LEFT JOIN branches fb ON d.from_branch_id = fb.id
      LEFT JOIN branches tb ON d.to_branch_id = tb.id
      WHERE ii.invoice_id = ?
    `, [invoiceId]);
    
    const tests = [];
    let allApproved = true;
    
    for (const item of itemRows) {
      if (item.status !== 'APPROVED') allApproved = false;
      
      const [params] = await pool.query(`
        SELECT tp.parameter_name, tp.unit, tp.reference_range_male, tp.reference_range_female, pl.id as parameter_id
        FROM test_parameters tp
        LEFT JOIN parameter_library pl ON tp.parameter_name = pl.parameter_name
        WHERE tp.test_id = ?
        ORDER BY tp.sort_order ASC, tp.id ASC
      `, [item.test_id]);
      
      const results = item.results_data ? (typeof item.results_data === 'string' ? JSON.parse(item.results_data) : item.results_data) : [];
      
      tests.push({
        item_id: item.id,
        test_name: item.test_name,
        status: item.status,
        is_local: item.perform_branch_id === invoiceInfo.branch_id,
        dispatch: item.dispatch_number ? {
          number: item.dispatch_number,
          status: item.dispatch_status,
          date: item.dispatch_date,
          from: item.from_branch_name,
          to: item.to_branch_name
        } : null,
        approved_by: item.approved_by,
        result_remarks: item.result_remarks,
        updated_at: item.updated_at,
        parameters: params,
        results: results
      });
    }
    
    // Fetch all active branches for the report footer
    const [branchRows] = await pool.query('SELECT id, name, city, address, phone, parent_id, logo FROM branches WHERE is_active = TRUE ORDER BY parent_id ASC, id ASC');

    res.json({
      success: true,
      data: {
        invoice: invoiceInfo,
        tests: tests,
        all_approved: allApproved,
        branches: branchRows
      }
    });
  } catch (error) {
    next(error);
  }
}

// ================= PROFIT & LOSS =================

async function getProfitLossReport(req, res, next) {
  try {
    const { start_date, end_date, target_branch_id } = req.query;

    let branchFilter = '';
    const params = [];

    // Date filters (required)
    let dateFilter = '1=1';
    const dateParams = [];
    if (start_date && end_date) {
      dateFilter = 'DATE(created_at) BETWEEN ? AND ?';
      dateParams.push(start_date, end_date);
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      if (target_branch_id && target_branch_id !== 'own' && target_branch_id !== 'all') {
         // Specific child branch selected
         branchFilter = 'branch_id = ?';
         params.push(target_branch_id);
      } else if (target_branch_id === 'all' && req.user.branch_family_ids && req.user.branch_family_ids.length > 0) {
         branchFilter = `branch_id IN (${req.user.branch_family_ids.map(()=>'?').join(',')})`;
         params.push(...req.user.branch_family_ids);
      } else {
         // 'own' or fallback
         branchFilter = 'branch_id = ?';
         params.push(req.user.branch_id || -1);
      }
    } else if (target_branch_id && target_branch_id !== 'all') {
      branchFilter = 'branch_id = ?';
      params.push(parseInt(target_branch_id, 10));
    } else {
      branchFilter = '1=1'; // Global
    }

    // 1. Revenue & Doctor Commissions (from invoices)
    const invQuery = `
      SELECT 
        SUM(total_amount) as total_revenue,
        SUM(doctor_commission_amount) as total_doctor_commissions
      FROM invoices 
      WHERE ${branchFilter} AND ${dateFilter}
    `;
    const [invRows] = await pool.query(invQuery, [...params, ...dateParams]);
    const revenue = parseFloat(invRows[0].total_revenue) || 0;
    const doctorCommissions = parseFloat(invRows[0].total_doctor_commissions) || 0;

    // 2. Expenses
    let expDateFilter = dateFilter.replace(/created_at/g, 'expense_date');
    const expQuery = `
      SELECT SUM(amount) as total_expenses
      FROM expenses 
      WHERE status = 'APPROVED' AND ${branchFilter} AND ${expDateFilter}
    `;
    const [expRows] = await pool.query(expQuery, [...params, ...dateParams]);
    const expenses = parseFloat(expRows[0].total_expenses) || 0;

    // 3. Salaries (Cash Outflows = PAYMENT + ADVANCE + BONUS)
    const salQuery = `
      SELECT SUM(amount) as total_salaries
      FROM salary_transactions
      WHERE type IN ('PAYMENT', 'ADVANCE', 'BONUS') AND ${branchFilter} AND ${dateFilter}
    `;
    const [salRows] = await pool.query(salQuery, [...params, ...dateParams]);
    const salaries = parseFloat(salRows[0].total_salaries) || 0;

    // 4. Inter-branch Commissions (commission_settlements)
    // Money we made from others (we are the to_branch_id/performing branch)
    // The user wants this to only show AFTER the performing branch has clicked "Received" (status = 'RECEIVED')
    // This now shows the COMPLETE amount received (profit + cost price)
    let perfFilter = branchFilter.replace(/branch_id/g, 'to_branch_id');
    const perfQuery = `
      SELECT SUM(performing_profit_amount + cost_price) as total_earned
      FROM commission_settlements
      WHERE status = 'RECEIVED' AND ${perfFilter} AND ${dateFilter}
    `;
    const [perfRows] = await pool.query(perfQuery, [...params, ...dateParams]);
    const interBranchEarned = parseFloat(perfRows[0].total_earned) || 0;

    // Money we paid to others (we are the from_branch_id/booking branch)
    // This is an expense as soon as we pay it (status = 'PAID' or 'RECEIVED')
    let bookFilter = branchFilter.replace(/branch_id/g, 'from_branch_id');
    const bookQuery = `
      SELECT SUM(performing_profit_amount + cost_price) as total_paid
      FROM commission_settlements
      WHERE status IN ('PAID', 'RECEIVED') AND ${bookFilter} AND ${dateFilter}
    `;
    const [bookRows] = await pool.query(bookQuery, [...params, ...dateParams]);
    const interBranchPaid = parseFloat(bookRows[0].total_paid) || 0;

    // 5. Test Costs
    // Total cost_price of all tests performed by this branch (internal & outsourced)
    let tcFilter = branchFilter.replace(/branch_id/g, 'ii.perform_branch_id');
    let tcDateFilter = dateFilter.replace(/created_at/g, 'i.created_at');
    const tcQuery = `
      SELECT SUM(ii.cost_price) as total_test_cost
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE ${tcFilter} AND ${tcDateFilter}
    `;
    const [tcRows] = await pool.query(tcQuery, [...params, ...dateParams]);
    const testCosts = parseFloat(tcRows[0].total_test_cost) || 0;

    // The net effect of inter-branch
    // Actually, "Revenue" already includes the money collected from patient for outsourced tests.
    // So if we collected 1000, and paid 800 to performing branch, our profit is 200.
    // We must DEDUCT 'interBranchPaid' as an expense.
    // If WE performed the test, the booking branch collected the money. They paid US 800.
    // We ADD 'interBranchEarned' to our revenue.

    const netProfit = revenue + interBranchEarned - (expenses + salaries + doctorCommissions + interBranchPaid + testCosts);

    res.json({
      success: true,
      data: {
        revenue,
        doctor_commissions: doctorCommissions,
        expenses,
        salaries,
        test_costs: testCosts,
        inter_branch_earned: interBranchEarned,
        inter_branch_paid: interBranchPaid,
        net_profit: netProfit
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceItemsByStatus,
  getTestStats,
  getDashboardStats,
  getTestItemDetails,
  getItemsByInvoice,
  submitTestResults,
  updateTestStatus,
  generateTrackToken,
  getTrackInvoiceByToken,
  getProfitLossReport
};
