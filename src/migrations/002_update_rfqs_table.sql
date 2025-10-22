-- Migration script to update rfqs table to include contact and special requirements fields
-- This script adds the missing columns to the rfqs table

ALTER TABLE rfqs 
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- Update existing rfqs to have NULL values for new columns if they don't exist
UPDATE rfqs 
SET contact_person = NULL, 
    contact_email = NULL, 
    contact_phone = NULL, 
    special_requirements = NULL 
WHERE contact_person IS NULL 
   OR contact_email IS NULL 
   OR contact_phone IS NULL 
   OR special_requirements IS NULL;