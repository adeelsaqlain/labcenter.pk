const { pool } = require('../../config/database');

async function ensureParameterColumns() {
  try {
    // Ensure extra columns on test_parameters
    const columns = [
      "ALTER TABLE test_parameters ADD COLUMN parameter_code VARCHAR(50);",
      "ALTER TABLE test_parameters ADD COLUMN required_sample VARCHAR(100);",
      "ALTER TABLE test_parameters ADD COLUMN important_notes TEXT;",
      "ALTER TABLE tests ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0.00;"
    ];
    for (let q of columns) {
      try {
        await pool.query(q);
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
          console.error("Column add error:", e);
        }
      }
    }

    // Create the parameter library table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parameter_library (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parameter_code VARCHAR(50),
        parameter_name VARCHAR(255) NOT NULL,
        unit VARCHAR(50),
        reference_range_male VARCHAR(100),
        reference_range_female VARCHAR(100),
        required_sample VARCHAR(100),
        important_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error("Ensure columns error:", error);
  }
}
ensureParameterColumns();

// ================= PARAMETER LIBRARY =================

async function getParameterLibrary(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM parameter_library ORDER BY parameter_name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function createLibraryParameter(req, res, next) {
  try {
    const { parameter_code, parameter_name, unit, reference_range_male, reference_range_female, required_sample, important_notes } = req.body;
    if (!parameter_name) {
      return res.status(400).json({ success: false, message: 'Parameter name is required' });
    }
    const [result] = await pool.query(
      `INSERT INTO parameter_library (parameter_code, parameter_name, unit, reference_range_male, reference_range_female, required_sample, important_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [parameter_code || null, parameter_name, unit || null, reference_range_male || null, reference_range_female || null, required_sample || null, important_notes || null]
    );
    const [newParam] = await pool.query('SELECT * FROM parameter_library WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newParam[0] });
  } catch (error) {
    next(error);
  }
}

async function deleteLibraryParameter(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM parameter_library WHERE id = ?', [id]);
    res.json({ success: true, message: 'Library parameter deleted' });
  } catch (error) {
    next(error);
  }
}

async function updateLibraryParameter(req, res, next) {
  try {
    const { id } = req.params;
    const { parameter_code, parameter_name, unit, reference_range_male, reference_range_female, required_sample, important_notes } = req.body;
    
    if (!parameter_name) {
      return res.status(400).json({ success: false, message: 'Parameter name is required' });
    }

    await pool.query(
      `UPDATE parameter_library 
       SET parameter_code = ?, parameter_name = ?, unit = ?, reference_range_male = ?, reference_range_female = ?, required_sample = ?, important_notes = ?
       WHERE id = ?`,
      [parameter_code || null, parameter_name, unit || null, reference_range_male || null, reference_range_female || null, required_sample || null, important_notes || null, id]
    );

    res.json({ success: true, message: 'Library parameter updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function assignParametersToTest(req, res, next) {
  try {
    const { testId } = req.params;
    const { parameterIds } = req.body; // array of library parameter IDs

    if (!Array.isArray(parameterIds) || parameterIds.length === 0) {
      return res.status(400).json({ success: false, message: 'parameterIds array is required' });
    }

    // Fetch selected library params
    const placeholders = parameterIds.map(() => '?').join(',');
    const [libraryParams] = await pool.query(
      `SELECT * FROM parameter_library WHERE id IN (${placeholders})`,
      parameterIds
    );

    // Insert each as a test_parameter (skip duplicates by name for this test)
    const [existing] = await pool.query(
      'SELECT parameter_name FROM test_parameters WHERE test_id = ?',
      [testId]
    );
    const existingNames = new Set(existing.map(r => r.parameter_name));
    const toInsert = libraryParams.filter(p => !existingNames.has(p.parameter_name));

    for (const p of toInsert) {
      await pool.query(
        `INSERT INTO test_parameters (test_id, parameter_code, parameter_name, unit, reference_range_male, reference_range_female, required_sample, important_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [testId, p.parameter_code, p.parameter_name, p.unit, p.reference_range_male, p.reference_range_female, p.required_sample, p.important_notes]
      );
    }

    const [updatedParams] = await pool.query(
      'SELECT * FROM test_parameters WHERE test_id = ? ORDER BY sort_order ASC, id ASC',
      [testId]
    );
    res.json({ success: true, data: updatedParams, assigned: toInsert.length, skipped: libraryParams.length - toInsert.length });
  } catch (error) {
    next(error);
  }
}

// ================= TEST GROUPS =================

async function getTestGroups(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM test_groups ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function createTestGroup(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const [result] = await pool.query('INSERT INTO test_groups (name) VALUES (?)', [name]);
    const [newGroup] = await pool.query('SELECT * FROM test_groups WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newGroup[0] });
  } catch (error) {
    next(error);
  }
}

async function toggleTestGroupActive(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query('UPDATE test_groups SET is_active = ? WHERE id = ?', [is_active, id]);
    res.json({ success: true, message: 'Test group status updated successfully' });
  } catch (error) {
    next(error);
  }
}


// ================= TESTS =================

async function getTests(req, res, next) {
  try {
    const requestedBranchId = req.query.branch_id;
    let targetBranchId = null;

    if (req.user.role === 'SUPER_ADMIN') {
      targetBranchId = requestedBranchId ? parseInt(requestedBranchId, 10) : null;
    } else {
      targetBranchId = req.user.branch_family_parent_id;
    }

    let query = `
      SELECT t.*, tg.name as test_group_name 
      FROM tests t
      LEFT JOIN test_groups tg ON t.test_group_id = tg.id
    `;
    const params = [];

    if (targetBranchId) {
      query = `
        SELECT 
          t.*, 
          tg.name as test_group_name,
          COALESCE(btp.price, t.price) as price,
          COALESCE(btp.cost_price, t.cost_price) as cost_price,
          btp.price as branch_sales_price,
          btp.cost_price as branch_cost_price
        FROM tests t
        LEFT JOIN test_groups tg ON t.test_group_id = tg.id
        LEFT JOIN branch_test_prices btp ON btp.test_id = t.id AND btp.branch_id = ?
      `;
      params.push(targetBranchId);
    }

    query += ' ORDER BY t.name ASC';
    
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function createTest(req, res, next) {
  try {
    const { test_group_id, test_code, name, description, price, cost_price, turn_around_time, sample_type } = req.body;
    
    if (!test_group_id || !test_code || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const [result] = await pool.query(
      `INSERT INTO tests 
      (test_group_id, test_code, name, description, price, cost_price, turn_around_time, sample_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [test_group_id, test_code, name, description, price, cost_price || 0, turn_around_time, sample_type]
    );

    const [newTest] = await pool.query(`
      SELECT t.*, tg.name as test_group_name 
      FROM tests t
      LEFT JOIN test_groups tg ON t.test_group_id = tg.id
      WHERE t.id = ?`, [result.insertId]
    );
    res.status(201).json({ success: true, data: newTest[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Test code already exists' });
    }
    next(error);
  }
}

async function updateTest(req, res, next) {
  try {
    const { id } = req.params;
    const { test_group_id, test_code, name, description, price, cost_price, turn_around_time, sample_type } = req.body;
    
    if (!test_group_id || !test_code || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    await pool.query(
      `UPDATE tests 
       SET test_group_id = ?, test_code = ?, name = ?, description = ?, price = ?, cost_price = ?, turn_around_time = ?, sample_type = ?
       WHERE id = ?`,
      [test_group_id, test_code, name, description, price, cost_price || 0, turn_around_time, sample_type, id]
    );

    res.json({ success: true, message: 'Test updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Test code already exists' });
    }
    next(error);
  }
}

async function toggleTestActive(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query('UPDATE tests SET is_active = ? WHERE id = ?', [is_active, id]);
    res.json({ success: true, message: 'Test status updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateBranchTestPrice(req, res, next) {
  try {
    const { testId } = req.params;
    const { price, cost_price, branch_id } = req.body;

    let targetBranchId;
    if (req.user.role === 'SUPER_ADMIN') {
      targetBranchId = branch_id;
      if (!targetBranchId) return res.status(400).json({ success: false, message: 'branch_id is required for super admin' });
    } else {
      // Only parent branches can customize prices
      if (!req.user.is_parent_branch) {
        return res.status(403).json({ success: false, message: 'Only the main/parent branch can customize test rates' });
      }
      targetBranchId = req.user.branch_family_parent_id;
      if (!targetBranchId) return res.status(400).json({ success: false, message: 'User does not belong to a branch family' });
    }

    if (price === undefined && cost_price === undefined) {
      return res.status(400).json({ success: false, message: 'Price or cost_price required' });
    }

    await pool.query(
      `INSERT INTO branch_test_prices (branch_id, test_id, price, cost_price)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE price = VALUES(price), cost_price = VALUES(cost_price)`,
      [targetBranchId, testId, price !== undefined ? price : null, cost_price !== undefined ? cost_price : null]
    );

    res.json({ success: true, message: 'Branch price updated successfully' });
  } catch (error) {
    console.error('updateBranchTestPrice error:', error);
    next(error);
  }
}

// ================= TEST PARAMETERS =================

async function getTestParameters(req, res, next) {
  try {
    const { testId } = req.params;
    const [rows] = await pool.query('SELECT * FROM test_parameters WHERE test_id = ? ORDER BY sort_order ASC, id ASC', [testId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}

async function createTestParameter(req, res, next) {
  try {
    const { testId } = req.params;
    const { parameter_code, parameter_name, unit, reference_range_male, reference_range_female, required_sample, important_notes } = req.body;
    
    if (!parameter_name) {
      return res.status(400).json({ success: false, message: 'Parameter name is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO test_parameters 
      (test_id, parameter_code, parameter_name, unit, reference_range_male, reference_range_female, required_sample, important_notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [testId, parameter_code || null, parameter_name, unit || null, reference_range_male || null, reference_range_female || null, required_sample || null, important_notes || null]
    );

    const [newParam] = await pool.query(`SELECT * FROM test_parameters WHERE id = ?`, [result.insertId]);
    res.status(201).json({ success: true, data: newParam[0] });
  } catch (error) {
    next(error);
  }
}

async function deleteTestParameter(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM test_parameters WHERE id = ?', [id]);
    res.json({ success: true, message: 'Parameter deleted successfully' });
  } catch (error) {
    next(error);
  }
}

async function updateTestParameter(req, res, next) {
  try {
    const { id } = req.params;
    const { parameter_code, parameter_name, unit, reference_range_male, reference_range_female, required_sample, important_notes } = req.body;
    
    if (!parameter_name) {
      return res.status(400).json({ success: false, message: 'Parameter name is required' });
    }

    await pool.query(
      `UPDATE test_parameters 
       SET parameter_code = ?, parameter_name = ?, unit = ?, reference_range_male = ?, reference_range_female = ?, required_sample = ?, important_notes = ?
       WHERE id = ?`,
      [parameter_code || null, parameter_name, unit || null, reference_range_male || null, reference_range_female || null, required_sample || null, important_notes || null, id]
    );

    res.json({ success: true, message: 'Parameter updated successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  // Library
  getParameterLibrary,
  createLibraryParameter,
  updateLibraryParameter,
  deleteLibraryParameter,
  assignParametersToTest,
  // Groups
  getTestGroups,
  createTestGroup,
  toggleTestGroupActive,
  // Tests
  getTests,
  createTest,
  updateTest,
  toggleTestActive,
  updateBranchTestPrice,
  // Test Parameters
  getTestParameters,
  createTestParameter,
  updateTestParameter,
  deleteTestParameter
};
