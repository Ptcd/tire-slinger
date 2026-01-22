-- =============================================
-- FIX: Convert diameter_inches from generated to regular column
-- Run this in Supabase SQL Editor to fix the 400 error when saving tires
-- =============================================

-- Convert diameter_inches from generated to regular column
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tires' 
    AND column_name = 'diameter_inches' 
    AND is_generated = 'ALWAYS'
  ) THEN
    -- Drop the generated column
    ALTER TABLE tires DROP COLUMN IF EXISTS diameter_inches;
    -- Recreate as regular column
    ALTER TABLE tires ADD COLUMN diameter_inches NUMERIC;
    -- Backfill existing rows with standard size calculation
    UPDATE tires SET diameter_inches = rim_diameter + 2.0 * (width * aspect_ratio / 100.0) / 25.4 
    WHERE diameter_inches IS NULL AND width > 0 AND aspect_ratio > 0;
    -- Backfill flotation sizes (use flotation_diameter directly)
    UPDATE tires SET diameter_inches = flotation_diameter 
    WHERE diameter_inches IS NULL AND is_flotation = TRUE AND flotation_diameter IS NOT NULL;
  END IF;
END $$;

-- Add missing flotation_rim column if it doesn't exist
ALTER TABLE tires ADD COLUMN IF NOT EXISTS flotation_rim INTEGER;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_generated,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tires' 
AND column_name IN ('diameter_inches', 'flotation_rim')
ORDER BY column_name;

