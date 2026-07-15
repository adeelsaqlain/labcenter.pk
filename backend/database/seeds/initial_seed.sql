-- 1. Global Settings
INSERT IGNORE INTO global_settings (id, app_name, currency, date_format) 
VALUES (1, 'Lab Diagnostic Center', 'PKR', 'DD/MM/YYYY');

-- 2. Branches
INSERT INTO branches (name, code, address, city, phone, email, watermark_text, header_text, footer_text) 
VALUES (
  'Multan Main Lab', 
  'BR-001', 
  '123 Main Lab Road, Nishtar Chowk', 
  'Multan', 
  '061-1234567', 
  'multan@labcenter.com', 
  'MULTAN LAB CONFIDENTIAL', 
  'Multan Main Diagnostic Center\n123 Main Lab Road, Nishtar Chowk', 
  'This is an electronically generated report from Multan Main Lab.'
);

-- 3. Users
-- Password for all is 'password123' (hashed using bcrypt with 12 rounds)
-- Hash generated via bcrypt.hashSync('password123', 12) -> $2b$12$WnjPpPdwKXglRU4vvB6jqOTGCMYQgkz7he4Q/7KK3ZqeIP6zoPIvi

-- SUPER_ADMIN (Has no branch_id)
INSERT INTO users (branch_id, name, email, password_hash, phone, role) 
VALUES (
  NULL, 
  'Super Admin', 
  'admin@labcenter.com', 
  '$2b$12$WnjPpPdwKXglRU4vvB6jqOTGCMYQgkz7he4Q/7KK3ZqeIP6zoPIvi', 
  '03000000001', 
  'SUPER_ADMIN'
);

-- BRANCH_ADMIN (Assigned to Branch 1)
INSERT INTO users (branch_id, name, email, password_hash, phone, role) 
VALUES (
  1, 
  'Multan Manager', 
  'manager.multan@labcenter.com', 
  '$2b$12$WnjPpPdwKXglRU4vvB6jqOTGCMYQgkz7he4Q/7KK3ZqeIP6zoPIvi', 
  '03000000002', 
  'BRANCH_ADMIN'
);

-- STAFF (Assigned to Branch 1)
INSERT INTO users (branch_id, name, email, password_hash, phone, role) 
VALUES (
  1, 
  'Staff Member', 
  'staff.multan@labcenter.com', 
  '$2b$12$WnjPpPdwKXglRU4vvB6jqOTGCMYQgkz7he4Q/7KK3ZqeIP6zoPIvi', 
  '03000000003', 
  'STAFF'
);
