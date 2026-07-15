-- ============================================================
-- GLOBAL SETTINGS (Singleton — system-wide configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS global_settings (
  id INT PRIMARY KEY DEFAULT 1,
  app_name VARCHAR(100) NOT NULL DEFAULT 'Lab Diagnostic Center',
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  date_format VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
  default_tax_rate DECIMAL(5,2) DEFAULT 0.00,
  smtp_host VARCHAR(255),
  smtp_port INT,
  smtp_user VARCHAR(255),
  smtp_password VARCHAR(255),
  sms_api_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_singleton CHECK (id = 1) -- Ensures only one row
);

-- ============================================================
-- BRANCHES (Multi-tenant anchor table)
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,               -- e.g., 'BR-001'
  address TEXT,
  city VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  logo_url VARCHAR(500),
  watermark_text VARCHAR(100) DEFAULT 'CONFIDENTIAL',
  header_text TEXT,                                 -- For PDF report headers
  footer_text TEXT,                                 -- For PDF report footers
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_branch_code (code),
  INDEX idx_branch_active (is_active)
);

-- ============================================================
-- USERS (Authentication + RBAC)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NULL,                              -- NULL for SUPER_ADMIN
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('SUPER_ADMIN', 'BRANCH_ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  INDEX idx_user_branch (branch_id),
  INDEX idx_user_role (role),
  INDEX idx_user_email (email)
);

-- ============================================================
-- PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  patient_code VARCHAR(30) NOT NULL,               -- Auto-generated: BR001-P-00001
  name VARCHAR(100) NOT NULL,
  father_husband_name VARCHAR(100),
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  dob DATE,
  age_years INT,                                    -- For when exact DOB unknown
  phone VARCHAR(20),
  email VARCHAR(100),
  cnic VARCHAR(15),                                 -- National ID (Pakistan)
  address TEXT,
  blood_group VARCHAR(5),
  referred_by VARCHAR(100),                         -- Doctor/Referral name
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  UNIQUE INDEX idx_patient_code (patient_code),
  INDEX idx_patient_branch (branch_id),
  INDEX idx_patient_phone (phone),
  INDEX idx_patient_name (name)
);

-- ============================================================
-- TESTS (Master catalog of available tests)
-- ============================================================
CREATE TABLE IF NOT EXISTS tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NULL,                              -- NULL = available globally
  test_code VARCHAR(20) NOT NULL,                  -- e.g., 'CBC', 'LFT'
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50),                            -- e.g., 'Hematology', 'Biochemistry'
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  turn_around_time VARCHAR(50),                    -- e.g., '2 hours', '24 hours'
  sample_type VARCHAR(50),                         -- e.g., 'Blood', 'Urine'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  INDEX idx_test_branch (branch_id),
  INDEX idx_test_code (test_code),
  INDEX idx_test_category (category)
);

-- ============================================================
-- TEST PARAMETERS (Sub-tests/parameters within a test)
-- ============================================================
CREATE TABLE IF NOT EXISTS test_parameters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  parameter_name VARCHAR(100) NOT NULL,            -- e.g., 'Hemoglobin', 'WBC Count'
  unit VARCHAR(30),                                 -- e.g., 'g/dL', 'mg/dL'
  reference_range_male VARCHAR(50),                -- e.g., '13.0-17.0'
  reference_range_female VARCHAR(50),              -- e.g., '12.0-15.5'
  reference_range_child VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  INDEX idx_param_test (test_id)
);

-- ============================================================
-- TEST RESULTS (Orders + individual results)
-- ============================================================
CREATE TABLE IF NOT EXISTS test_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  patient_id INT NOT NULL,
  test_id INT NOT NULL,
  report_code VARCHAR(30) NOT NULL UNIQUE,         -- e.g., 'BR001-R-20250620-001'
  
  -- Result data (stored as JSON for flexibility with multi-parameter tests)
  results_data JSON,                                -- [{ param_id, value, status }]
  
  -- Workflow status
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'DELIVERED') 
    DEFAULT 'PENDING',
  
  -- Personnel tracking
  sample_collected_by INT,
  tested_by INT,
  verified_by INT,
  
  -- Timestamps
  sample_collected_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  verified_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE RESTRICT,
  FOREIGN KEY (sample_collected_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (tested_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_result_branch (branch_id),
  INDEX idx_result_patient (patient_id),
  INDEX idx_result_status (status),
  INDEX idx_result_date (created_at),
  INDEX idx_result_report_code (report_code)
);

-- ============================================================
-- FINANCIAL LEDGER (Double-entry style)
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  
  -- Transaction details
  transaction_type ENUM('INVOICE', 'PAYMENT', 'REFUND', 'EXPENSE', 'ADJUSTMENT') NOT NULL,
  reference_type VARCHAR(30),                      -- 'test_result', 'expense', etc.
  reference_id INT,                                 -- FK to the source record
  
  -- Financial data
  description VARCHAR(255) NOT NULL,
  debit DECIMAL(12,2) DEFAULT 0.00,                -- Money going OUT
  credit DECIMAL(12,2) DEFAULT 0.00,               -- Money coming IN
  balance DECIMAL(12,2) DEFAULT 0.00,              -- Running balance (calculated)
  
  -- Payment metadata
  payment_method ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'INSURANCE') NULL,
  
  -- Audit
  patient_id INT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  
  INDEX idx_ledger_branch (branch_id),
  INDEX idx_ledger_type (transaction_type),
  INDEX idx_ledger_date (created_at),
  INDEX idx_ledger_patient (patient_id),
  INDEX idx_ledger_reference (reference_type, reference_id)
);
