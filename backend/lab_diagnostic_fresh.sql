-- ============================================================
-- Lab Diagnostic Center - Fresh Database Setup
-- Generated: 2026-07-15T15:07:12.302Z
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `address` text,
  `city` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `watermark_text` varchar(100) DEFAULT 'CONFIDENTIAL',
  `header_text` text,
  `footer_text` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `logo` longtext,
  `receipt_mode` varchar(20) DEFAULT 'main_lab',
  `parent_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_branch_code` (`code`),
  KEY `idx_branch_active` (`is_active`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_10` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_100` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_101` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_102` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_103` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_104` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_105` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_106` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_107` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_108` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_109` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_11` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_110` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_111` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_112` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_113` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_114` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_115` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_116` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_117` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_118` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_119` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_12` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_120` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_121` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_122` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_123` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_124` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_125` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_126` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_127` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_128` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_129` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_13` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_130` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_131` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_132` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_133` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_134` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_135` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_136` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_137` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_138` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_139` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_14` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_140` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_141` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_142` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_143` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_144` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_145` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_146` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_147` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_148` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_149` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_15` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_150` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_151` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_152` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_153` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_154` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_155` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_156` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_157` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_158` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_159` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_16` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_160` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_161` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_162` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_163` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_164` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_165` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_166` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_167` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_168` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_169` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_17` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_170` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_171` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_172` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_18` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_19` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_20` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_21` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_22` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_23` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_24` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_25` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_26` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_27` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_28` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_29` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_30` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_31` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_32` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_33` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_34` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_35` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_36` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_37` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_38` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_39` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_4` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_40` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_41` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_42` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_43` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_44` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_45` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_46` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_47` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_48` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_49` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_5` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_50` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_51` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_52` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_53` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_54` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_55` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_56` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_57` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_58` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_59` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_6` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_60` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_61` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_62` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_63` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_64` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_65` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_66` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_67` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_68` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_69` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_7` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_70` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_71` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_72` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_73` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_74` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_75` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_76` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_77` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_78` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_79` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_8` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_80` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_81` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_82` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_83` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_84` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_85` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_86` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_87` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_88` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_89` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_9` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_90` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_91` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_92` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_93` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_94` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_95` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_96` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_97` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_98` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `branches_ibfk_99` FOREIGN KEY (`parent_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('SUPER_ADMIN','BRANCH_ADMIN','BRANCH_MANAGER','STAFF','LAB_TECHNICIAN','PATHOLOGIST','DOCTOR') NOT NULL DEFAULT 'STAFF',
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `referring_doctor_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_branch` (`branch_id`),
  KEY `idx_user_role` (`role`),
  KEY `idx_user_email` (`email`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `global_settings`;
CREATE TABLE `global_settings` (
  `id` int NOT NULL DEFAULT '1',
  `app_name` varchar(100) NOT NULL DEFAULT 'Lab Diagnostic Center',
  `currency` varchar(10) NOT NULL DEFAULT 'PKR',
  `date_format` varchar(20) NOT NULL DEFAULT 'DD/MM/YYYY',
  `default_tax_rate` decimal(5,2) DEFAULT '0.00',
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` int DEFAULT NULL,
  `smtp_user` varchar(255) DEFAULT NULL,
  `smtp_password` varchar(255) DEFAULT NULL,
  `sms_api_key` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `master_email` varchar(100) DEFAULT NULL,
  `master_phone` varchar(50) DEFAULT NULL,
  `head_office_address` text,
  `global_report_footer_text` text,
  `logo_base64` longtext,
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_singleton` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tests`;
CREATE TABLE `tests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int DEFAULT NULL,
  `test_code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `test_group_id` int NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `turn_around_time` varchar(50) DEFAULT NULL,
  `sample_type` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cost_price` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_test_branch` (`branch_id`),
  KEY `idx_test_code` (`test_code`),
  KEY `fk_tests_test_group` (`test_group_id`),
  CONSTRAINT `fk_tests_test_group` FOREIGN KEY (`test_group_id`) REFERENCES `test_groups` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `tests_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `test_groups`;
CREATE TABLE `test_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `test_parameters`;
CREATE TABLE `test_parameters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_id` int NOT NULL,
  `parameter_name` varchar(100) NOT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `reference_range_male` varchar(50) DEFAULT NULL,
  `reference_range_female` varchar(50) DEFAULT NULL,
  `reference_range_child` varchar(50) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `parameter_code` varchar(50) DEFAULT NULL,
  `required_sample` varchar(100) DEFAULT NULL,
  `important_notes` text,
  PRIMARY KEY (`id`),
  KEY `idx_param_test` (`test_id`),
  CONSTRAINT `test_parameters_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `parameter_library`;
CREATE TABLE `parameter_library` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parameter_code` varchar(50) DEFAULT NULL,
  `parameter_name` varchar(255) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `reference_range_male` varchar(100) DEFAULT NULL,
  `reference_range_female` varchar(100) DEFAULT NULL,
  `required_sample` varchar(100) DEFAULT NULL,
  `important_notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `patients`;
CREATE TABLE `patients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `patient_code` varchar(30) NOT NULL,
  `name` varchar(100) NOT NULL,
  `age` int DEFAULT NULL,
  `father_husband_name` varchar(100) DEFAULT NULL,
  `gender` enum('Male','Female','Other') NOT NULL,
  `dob` date DEFAULT NULL,
  `age_years` int DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `cnic` varchar(15) DEFAULT NULL,
  `address` text,
  `blood_group` varchar(5) DEFAULT NULL,
  `referred_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_patient_code` (`patient_code`),
  KEY `idx_patient_branch` (`branch_id`),
  KEY `idx_patient_phone` (`phone`),
  KEY `idx_patient_name` (`name`),
  CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL,
  `branch_id` int DEFAULT NULL,
  `patient_id` int NOT NULL,
  `referring_doctor_id` int DEFAULT NULL,
  `doctor_commission_amount` decimal(10,2) DEFAULT '0.00',
  `doctor_discount_amount` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `amount_paid` decimal(10,2) DEFAULT '0.00',
  `payment_method` varchar(50) DEFAULT NULL,
  `pin_code` varchar(10) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `branch_id` (`branch_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `test_id` int NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `status` enum('PENDING_SAMPLE','RESULTS_ENTERED','APPROVED','REJECTED') DEFAULT 'PENDING_SAMPLE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `result_remarks` text,
  `results_data` json DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_by` varchar(255) DEFAULT NULL,
  `is_outsourced` tinyint(1) DEFAULT '0',
  `perform_branch_id` int DEFAULT NULL,
  `dispatch_id` int DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT '0.00',
  `booking_profit_pct` decimal(5,2) DEFAULT '0.00',
  `performing_profit_pct` decimal(5,2) DEFAULT '0.00',
  `booking_profit_amount` decimal(10,2) DEFAULT '0.00',
  `performing_profit_amount` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `test_id` (`test_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `test_results`;
CREATE TABLE `test_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `patient_id` int NOT NULL,
  `test_id` int NOT NULL,
  `report_code` varchar(30) NOT NULL,
  `results_data` json DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','VERIFIED','DELIVERED') DEFAULT 'PENDING',
  `sample_collected_by` int DEFAULT NULL,
  `tested_by` int DEFAULT NULL,
  `verified_by` int DEFAULT NULL,
  `sample_collected_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `report_code` (`report_code`),
  KEY `test_id` (`test_id`),
  KEY `sample_collected_by` (`sample_collected_by`),
  KEY `tested_by` (`tested_by`),
  KEY `verified_by` (`verified_by`),
  KEY `idx_result_branch` (`branch_id`),
  KEY `idx_result_patient` (`patient_id`),
  KEY `idx_result_status` (`status`),
  KEY `idx_result_date` (`created_at`),
  KEY `idx_result_report_code` (`report_code`),
  CONSTRAINT `test_results_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `test_results_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `test_results_ibfk_3` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `test_results_ibfk_4` FOREIGN KEY (`sample_collected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `test_results_ibfk_5` FOREIGN KEY (`tested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `test_results_ibfk_6` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `test_dispatches`;
CREATE TABLE `test_dispatches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dispatch_number` varchar(50) NOT NULL,
  `invoice_item_id` int NOT NULL,
  `from_branch_id` int NOT NULL,
  `to_branch_id` int NOT NULL,
  `status` enum('PENDING_DISPATCH','DISPATCHED','RECEIVED','IN_PROGRESS','COMPLETED') DEFAULT 'PENDING_DISPATCH',
  `dispatched_by` int DEFAULT NULL,
  `dispatched_at` timestamp NULL DEFAULT NULL,
  `received_by` int DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dispatch_number` (`dispatch_number`),
  KEY `invoice_item_id` (`invoice_item_id`),
  KEY `from_branch_id` (`from_branch_id`),
  KEY `to_branch_id` (`to_branch_id`),
  KEY `dispatched_by` (`dispatched_by`),
  KEY `received_by` (`received_by`),
  CONSTRAINT `test_dispatches_ibfk_1` FOREIGN KEY (`invoice_item_id`) REFERENCES `invoice_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `test_dispatches_ibfk_2` FOREIGN KEY (`from_branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `test_dispatches_ibfk_3` FOREIGN KEY (`to_branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `test_dispatches_ibfk_4` FOREIGN KEY (`dispatched_by`) REFERENCES `users` (`id`),
  CONSTRAINT `test_dispatches_ibfk_5` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `referring_doctors`;
CREATE TABLE `referring_doctors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `clinic` varchar(255) DEFAULT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `commission_percent` decimal(5,2) DEFAULT '0.00',
  `commission_category` enum('ON_TEST_RATE','ON_TEST_PROFIT') DEFAULT 'ON_TEST_RATE',
  `patient_discount_percent` decimal(5,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text,
  `amount` decimal(10,2) NOT NULL,
  `expense_date` date NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('PENDING','APPROVED') DEFAULT 'PENDING',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `commission_settlements`;
CREATE TABLE `commission_settlements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_branch_id` int NOT NULL,
  `to_branch_id` int NOT NULL,
  `from_branch_name` varchar(255) DEFAULT NULL,
  `to_branch_name` varchar(255) DEFAULT NULL,
  `month` varchar(7) NOT NULL COMMENT 'YYYY-MM',
  `invoice_item_id` int NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `dispatch_number` varchar(100) DEFAULT NULL,
  `test_name` varchar(255) DEFAULT NULL,
  `patient_name` varchar(255) DEFAULT NULL,
  `test_rate` decimal(10,2) DEFAULT '0.00',
  `discount_percentage` decimal(5,2) DEFAULT '0.00',
  `discounted_price` decimal(10,2) DEFAULT '0.00',
  `cost_price` decimal(10,2) DEFAULT '0.00',
  `booking_profit_amount` decimal(10,2) DEFAULT '0.00',
  `performing_profit_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('PENDING','PAID','RECEIVED') DEFAULT 'PENDING',
  `paid_by_id` int DEFAULT NULL,
  `paid_by_name` varchar(255) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `received_by_id` int DEFAULT NULL,
  `received_by_name` varchar(255) DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_settlement_item` (`invoice_item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2768 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `doctor_commission_settlements`;
CREATE TABLE `doctor_commission_settlements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `referring_doctor_id` int NOT NULL,
  `doctor_name` varchar(255) DEFAULT NULL,
  `branch_id` int NOT NULL,
  `branch_name` varchar(255) DEFAULT NULL,
  `month` varchar(7) NOT NULL COMMENT 'YYYY-MM',
  `invoice_id` int NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `patient_name` varchar(255) DEFAULT NULL,
  `commission_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('PENDING','PAID','RECEIVED','PAID_TO_DOCTOR','CONFIRMED') DEFAULT 'PENDING',
  `paid_by_id` int DEFAULT NULL,
  `paid_by_name` varchar(255) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `received_by_id` int DEFAULT NULL,
  `received_by_name` varchar(255) DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `paid_to_doctor_by_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doc_settlement` (`invoice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=764 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `branch_test_config`;
CREATE TABLE `branch_test_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `test_id` int NOT NULL,
  `perform_mode` enum('IN_HOUSE','OUTSOURCED') DEFAULT 'IN_HOUSE',
  `default_source_branch_id` int DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT '0.00',
  `selling_price` decimal(10,2) DEFAULT '0.00',
  `booking_branch_profit_pct` decimal(5,2) DEFAULT '0.00',
  `performing_branch_profit_pct` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_branch_test` (`branch_id`,`test_id`),
  KEY `test_id` (`test_id`),
  KEY `default_source_branch_id` (`default_source_branch_id`),
  CONSTRAINT `branch_test_config_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `branch_test_config_ibfk_2` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `branch_test_config_ibfk_3` FOREIGN KEY (`default_source_branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `branch_test_prices`;
CREATE TABLE `branch_test_prices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `test_id` int NOT NULL,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_branch_test` (`branch_id`,`test_id`),
  KEY `test_id` (`test_id`),
  CONSTRAINT `branch_test_prices_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `branch_test_prices_ibfk_2` FOREIGN KEY (`test_id`) REFERENCES `tests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `branch_tests`;
CREATE TABLE `branch_tests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `test_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_branch_test` (`branch_id`,`test_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `financial_ledger`;
CREATE TABLE `financial_ledger` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `transaction_type` enum('INVOICE','PAYMENT','REFUND','EXPENSE','ADJUSTMENT') NOT NULL,
  `reference_type` varchar(30) DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `debit` decimal(12,2) DEFAULT '0.00',
  `credit` decimal(12,2) DEFAULT '0.00',
  `balance` decimal(12,2) DEFAULT '0.00',
  `payment_method` enum('CASH','CARD','BANK_TRANSFER','ONLINE','INSURANCE') DEFAULT NULL,
  `patient_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_ledger_branch` (`branch_id`),
  KEY `idx_ledger_type` (`transaction_type`),
  KEY `idx_ledger_date` (`created_at`),
  KEY `idx_ledger_patient` (`patient_id`),
  KEY `idx_ledger_reference` (`reference_type`,`reference_id`),
  CONSTRAINT `financial_ledger_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `financial_ledger_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `financial_ledger_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` enum('BRANCH_ADMIN','BRANCH_MANAGER','STAFF','LAB_TECHNICIAN','PATHOLOGIST') NOT NULL,
  `permission_key` varchar(100) NOT NULL,
  `is_allowed` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`,`permission_key`)
) ENGINE=InnoDB AUTO_INCREMENT=355 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `salary_transactions`;
CREATE TABLE `salary_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `month` int NOT NULL,
  `year` int NOT NULL,
  `type` enum('ADVANCE','DEDUCTION','BONUS','PAYMENT') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `note` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `staff_salaries`;
CREATE TABLE `staff_salaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `branch_id` int NOT NULL,
  `base_salary` decimal(10,2) DEFAULT '0.00',
  `effective_from` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Default SUPER_ADMIN User
-- Email: adeelsaqlain@labcenter.pk
-- Password: As@03036749169
-- ============================================================
INSERT INTO `users` (`name`, `email`, `password`, `role`, `branch_id`, `is_active`)
VALUES ('Super Admin', 'adeelsaqlain@labcenter.pk', '$2b$10$vxvbT.oVn.hSmHF6rLqb5.nFMgRV4sc8zCm/eZ5M..Afrfp.Kug1C', 'SUPER_ADMIN', NULL, 1);

-- ============================================================
-- Default Global Settings
-- ============================================================
INSERT INTO `global_settings` (`id`, `app_name`, `currency`)
VALUES (1, 'Lab Diagnostic Center', 'PKR')
ON DUPLICATE KEY UPDATE id = id;
