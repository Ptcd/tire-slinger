-- Setup for importing Teoalida fitment database
-- Run this in Supabase SQL Editor before running the import script

-- Add unique constraint if not exists (enables upsert operations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fitment_vehicles_unique'
  ) THEN
    ALTER TABLE fitment_vehicles 
      ADD CONSTRAINT fitment_vehicles_unique 
      UNIQUE (year, make, model, trim);
  END IF;
END $$;

-- Add unique constraint for tire sizes if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fitment_tire_sizes_unique'
  ) THEN
    ALTER TABLE fitment_tire_sizes
      ADD CONSTRAINT fitment_tire_sizes_unique
      UNIQUE (vehicle_id, width, aspect_ratio, rim_diameter);
  END IF;
END $$;

-- Clear existing seed data to start fresh
-- This will delete the sample data and allow clean import
TRUNCATE TABLE fitment_tire_sizes;
TRUNCATE TABLE fitment_vehicles CASCADE;

-- Verify constraints were added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'fitment_vehicles'::regclass
  AND conname LIKE '%unique%';

SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'fitment_tire_sizes'::regclass
  AND conname LIKE '%unique%';

