-- Create inventory_settings table for Stock Intelligence feature
CREATE TABLE IF NOT EXISTS inventory_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  sales_window_days INTEGER DEFAULT 90,
  search_window_days INTEGER DEFAULT 90,
  min_search_threshold INTEGER DEFAULT 3,
  stale_age_days INTEGER DEFAULT 1800,
  overstock_percent INTEGER DEFAULT 50,
  safety_multiplier NUMERIC(3,1) DEFAULT 2.0,
  packaging_set_size INTEGER DEFAULT 4,
  enable_search_demand BOOLEAN DEFAULT TRUE,
  enable_request_demand BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE inventory_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for org members
CREATE POLICY "Org members manage settings" ON inventory_settings 
  FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_settings_updated_at 
  BEFORE UPDATE ON inventory_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

