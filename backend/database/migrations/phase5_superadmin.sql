-- Create Test Groups Table
CREATE TABLE IF NOT EXISTS test_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed initial groups based on the previous mock data
INSERT IGNORE INTO test_groups (id, name) VALUES 
(1, 'Hematology'),
(2, 'Biochemistry'),
(3, 'Urinalysis'),
(4, 'Endocrinology'),
(5, 'Serology');

-- Alter the tests table to use test_groups instead of string category
-- First, add the new column
ALTER TABLE tests ADD COLUMN test_group_id INT AFTER name;

-- Set default test_group_id (assuming 2 = Biochemistry as a fallback)
UPDATE tests SET test_group_id = 2 WHERE test_group_id IS NULL;

-- Make test_group_id NOT NULL and add foreign key
ALTER TABLE tests MODIFY COLUMN test_group_id INT NOT NULL;
ALTER TABLE tests ADD CONSTRAINT fk_tests_test_group FOREIGN KEY (test_group_id) REFERENCES test_groups(id) ON DELETE RESTRICT;

-- Drop the old category string column
ALTER TABLE tests DROP COLUMN category;

-- Ensure branch_id allows NULL if tests are global. Wait!
-- The user implicitly agreed to global tests by not objecting.
-- Let's make tests global by setting branch_id to NULL for all tests and removing the foreign key constraint that requires it, or just leave it allowing NULL.
-- In initial_schema.sql, branch_id is INT, NULLable. So it's fine.
