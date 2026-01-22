-- =============================================
-- TIRE CATALOG TABLE (for brand/model lookup)
-- =============================================
CREATE TABLE IF NOT EXISTS tire_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model_name TEXT NOT NULL,
  category TEXT,
  
  -- Standard format fields (NULL if flotation size)
  width INTEGER,
  aspect_ratio INTEGER,
  rim_diameter INTEGER,
  
  -- Flotation format fields (NULL if standard size)
  flotation_diameter DECIMAL(4,1),
  flotation_width DECIMAL(4,2),
  flotation_rim INTEGER,
  
  -- Common fields
  is_lt BOOLEAN DEFAULT FALSE,
  size_display TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_tire_catalog UNIQUE(brand, model_name, size_display)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tire_catalog_standard 
  ON tire_catalog(width, aspect_ratio, rim_diameter) 
  WHERE width IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tire_catalog_flotation 
  ON tire_catalog(flotation_diameter, flotation_width, flotation_rim) 
  WHERE flotation_diameter IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tire_catalog_brand ON tire_catalog(brand);
CREATE INDEX IF NOT EXISTS idx_tire_catalog_model ON tire_catalog(model_name);

-- =============================================
-- UPDATE ORGANIZATIONS TABLE
-- =============================================
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS allow_custom_brand BOOLEAN DEFAULT TRUE;

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS require_model_selection BOOLEAN DEFAULT FALSE;

-- =============================================
-- UPDATE TIRES TABLE
-- =============================================
-- First, drop the generated column if it exists and recreate as regular column
DO $$ 
BEGIN
  -- Check if size_display is a generated column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tires' 
    AND column_name = 'size_display' 
    AND is_generated = 'ALWAYS'
  ) THEN
    -- Drop the generated column
    ALTER TABLE tires DROP COLUMN IF EXISTS size_display;
    -- Recreate as regular column
    ALTER TABLE tires ADD COLUMN size_display TEXT;
    -- Update existing rows
    UPDATE tires SET size_display = width || '/' || aspect_ratio || 'R' || rim_diameter WHERE size_display IS NULL;
  END IF;
END $$;

ALTER TABLE tires 
  ADD COLUMN IF NOT EXISTS is_lt BOOLEAN DEFAULT FALSE;

ALTER TABLE tires 
  ADD COLUMN IF NOT EXISTS is_flotation BOOLEAN DEFAULT FALSE;

ALTER TABLE tires 
  ADD COLUMN IF NOT EXISTS flotation_diameter DECIMAL(4,1);

ALTER TABLE tires 
  ADD COLUMN IF NOT EXISTS flotation_width DECIMAL(4,2);

ALTER TABLE tires 
  ADD COLUMN IF NOT EXISTS flotation_rim INTEGER;

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

-- =============================================
-- UPDATE FITMENT TABLES (if not already comprehensive)
-- =============================================
-- The existing fitment_vehicles and fitment_tire_sizes tables
-- will be populated by the import script. No schema changes needed.

