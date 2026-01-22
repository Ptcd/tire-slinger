-- HOTFIX: Add missing columns to organizations table
-- Run this in Supabase SQL Editor

-- Add the new settings columns to organizations
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS allow_custom_brand BOOLEAN DEFAULT TRUE;

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS require_model_selection BOOLEAN DEFAULT FALSE;

-- Update existing rows to have default values
UPDATE organizations 
SET allow_custom_brand = TRUE 
WHERE allow_custom_brand IS NULL;

UPDATE organizations 
SET require_model_selection = FALSE 
WHERE require_model_selection IS NULL;

-- Verify it worked
SELECT id, name, allow_custom_brand, require_model_selection FROM organizations;

