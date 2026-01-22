-- Add field requirement settings to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS require_images BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS require_tread_depth BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS require_dot BOOLEAN DEFAULT FALSE;

