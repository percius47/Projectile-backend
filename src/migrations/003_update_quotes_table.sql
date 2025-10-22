-- Migration to update quotes table to reference users table instead of vendors table

-- First, drop the existing foreign key constraint
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_vendor_id_fkey;

-- Then, update the vendor_id column to reference users table instead of vendors table
-- We'll keep the column name as vendor_id for now to minimize code changes, but it will now reference users.id
ALTER TABLE quotes 
ADD CONSTRAINT quotes_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE;