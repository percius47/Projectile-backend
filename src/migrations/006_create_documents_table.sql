-- Migration to create documents table for file uploads

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- project, rfq, requirement, quote
    entity_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL, -- Generated filename
    original_name VARCHAR(255) NOT NULL, -- Original filename
    file_path VARCHAR(500) NOT NULL, -- Path to file on server
    file_size INTEGER NOT NULL, -- File size in bytes
    mime_type VARCHAR(100) NOT NULL, -- MIME type of file
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);