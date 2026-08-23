-- Creates a limited MySQL user for the School LMS app.
-- Grants only SELECT, INSERT, UPDATE, DELETE on the app database (no DDL, no GRANT OPTION).
-- Run as an admin user (e.g. root): mysql -u root -p < sql/create_lms_user.sql

CREATE USER IF NOT EXISTS 'lms_user'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';

GRANT SELECT, INSERT, UPDATE, DELETE ON school_lms.* TO 'lms_user'@'localhost';

FLUSH PRIVILEGES;
