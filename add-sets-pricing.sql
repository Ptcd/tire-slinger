-- Add sale_type column (individual, pair, or set)
ALTER TABLE tires ADD COLUMN IF NOT EXISTS sale_type TEXT DEFAULT 'individual' 
  CHECK (sale_type IN ('individual', 'pair', 'set'));

-- Add set_price column (price when sold as pair/set)
ALTER TABLE tires ADD COLUMN IF NOT EXISTS set_price NUMERIC;

-- Verify
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'tires' AND column_name IN ('sale_type', 'set_price');

