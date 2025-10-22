-- Migration script to update users table to include all business details
-- This script adds the missing columns to the users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(50);

-- Update existing users to have empty values for new columns if they don't exist
UPDATE users 
SET contact_person = '', 
    address = '', 
    gst_number = '' 
WHERE contact_person IS NULL 
   OR address IS NULL 
   OR gst_number IS NULL;