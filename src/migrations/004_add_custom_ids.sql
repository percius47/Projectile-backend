-- Migration to add custom ID columns to all tables

-- Add custom_id columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS custom_id VARCHAR(50) UNIQUE;

-- Add custom_id columns to requirements table
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS custom_id VARCHAR(50) UNIQUE;

-- Add custom_id columns to rfqs table
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS custom_id VARCHAR(50) UNIQUE;

-- Add custom_id columns to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS custom_id VARCHAR(50) UNIQUE;

-- Add project_custom_id column to requirements table for better navigation
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS project_custom_id VARCHAR(50);

-- Add project_custom_id column to rfqs table for better navigation
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS project_custom_id VARCHAR(50);

-- Add rfq_custom_id column to quotes table for better navigation
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS rfq_custom_id VARCHAR(50);

-- Add vendor_custom_id column to quotes table for better navigation
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS vendor_custom_id VARCHAR(50);