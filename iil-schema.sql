-- =============================================
-- INVENTORY INTELLIGENCE LAYER SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. SALES EVENTS TABLE
-- Logs every tire sale for demand tracking
CREATE TABLE IF NOT EXISTS sales_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  size_key TEXT NOT NULL,
  quantity_sold INTEGER NOT NULL DEFAULT 1,
  packaging_type TEXT DEFAULT 'individual' CHECK (packaging_type IN ('individual', 'pair', 'set')),
  unit_price NUMERIC,
  tire_id UUID REFERENCES tires(id) ON DELETE SET NULL,
  sold_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_events_org ON sales_events(org_id);
CREATE INDEX idx_sales_events_size ON sales_events(org_id, size_key);
CREATE INDEX idx_sales_events_date ON sales_events(org_id, sold_at DESC);

-- 2. SEARCH EVENTS TABLE
-- Logs searches that returned no results (demand signal)
CREATE TABLE IF NOT EXISTS search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query TEXT,
  requested_size TEXT,
  width INTEGER,
  aspect_ratio INTEGER,
  rim_diameter INTEGER,
  requested_quantity INTEGER DEFAULT 1,
  result_count INTEGER NOT NULL DEFAULT 0,
  user_role TEXT DEFAULT 'customer',
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_events_org ON search_events(org_id);
CREATE INDEX idx_search_events_size ON search_events(org_id, requested_size);
CREATE INDEX idx_search_events_date ON search_events(org_id, searched_at DESC);

-- 3. CUSTOMER REQUESTS TABLE
-- Inbox for customer tire requests
CREATE TABLE IF NOT EXISTS customer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_name TEXT,
  contact_info TEXT NOT NULL,
  requested_size TEXT NOT NULL,
  width INTEGER,
  aspect_ratio INTEGER,
  rim_diameter INTEGER,
  requested_quantity INTEGER DEFAULT 1,
  notes TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'fulfilled', 'dismissed')),
  handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_requests_org ON customer_requests(org_id);
CREATE INDEX idx_customer_requests_status ON customer_requests(org_id, status);

-- 4. STOCK RECOMMENDATIONS TABLE
-- Cached recommendations (recomputed periodically)
CREATE TABLE IF NOT EXISTS stock_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  size_key TEXT NOT NULL,
  size_display TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  target_stock INTEGER NOT NULL DEFAULT 0,
  need_units INTEGER NOT NULL DEFAULT 0,
  action TEXT NOT NULL DEFAULT 'hold' CHECK (action IN ('stock', 'purge', 'hold')),
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('high', 'medium', 'low')),
  flag TEXT CHECK (flag IN ('normal', 'overstock', 'stale')),
  sales_90d INTEGER DEFAULT 0,
  searches_90d INTEGER DEFAULT 0,
  requests_90d INTEGER DEFAULT 0,
  avg_age_days INTEGER,
  oldest_age_days INTEGER,
  reasons JSONB DEFAULT '[]',
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, size_key)
);

CREATE INDEX idx_stock_recs_org ON stock_recommendations(org_id);
CREATE INDEX idx_stock_recs_action ON stock_recommendations(org_id, action);

-- 5. INVENTORY SETTINGS TABLE
-- Per-organization configuration for the recommendation engine
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

-- 6. ADD COLUMNS TO ORGANIZATIONS TABLE
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS capacity_total_tires INTEGER DEFAULT 200;

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS default_packaging_type TEXT DEFAULT 'individual' 
  CHECK (default_packaging_type IN ('individual', 'pair', 'set'));

ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS recommendations_stale BOOLEAN DEFAULT TRUE;

-- 7. ADD COLUMNS TO TIRES TABLE
ALTER TABLE tires 
  ADD COLUMN IF NOT EXISTS size_key TEXT;

ALTER TABLE tires 
  ADD COLUMN IF NOT EXISTS last_sold_at TIMESTAMPTZ;

-- 8. BACKFILL size_key FOR EXISTING TIRES
UPDATE tires 
SET size_key = width || '-' || aspect_ratio || '-' || rim_diameter 
WHERE size_key IS NULL;

-- 9. CREATE INDEX ON size_key
CREATE INDEX IF NOT EXISTS idx_tires_size_key ON tires(org_id, size_key);

-- 10. ROW LEVEL SECURITY
ALTER TABLE sales_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_settings ENABLE ROW LEVEL SECURITY;

-- Sales events: org members can read/insert
CREATE POLICY "Org members manage sales_events" ON sales_events 
  FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Search events: anyone can insert (public searches), org members can read
CREATE POLICY "Anyone can insert search_events" ON search_events 
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Org members read search_events" ON search_events 
  FOR SELECT USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Customer requests: anyone can insert, org members can manage
CREATE POLICY "Anyone can submit requests" ON customer_requests 
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Org members manage requests" ON customer_requests 
  FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Stock recommendations: org members only
CREATE POLICY "Org members manage recommendations" ON stock_recommendations 
  FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Inventory settings: org members only
CREATE POLICY "Org members manage settings" ON inventory_settings 
  FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 11. TRIGGER: Update customer_requests.updated_at
CREATE TRIGGER update_customer_requests_updated_at 
  BEFORE UPDATE ON customer_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 12. TRIGGER: Update inventory_settings.updated_at
CREATE TRIGGER update_inventory_settings_updated_at 
  BEFORE UPDATE ON inventory_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 13. FUNCTION: Flag recommendations as stale when events occur
CREATE OR REPLACE FUNCTION flag_recommendations_stale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE organizations SET recommendations_stale = TRUE WHERE id = NEW.org_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. TRIGGERS: Flag stale on new events
CREATE TRIGGER on_sale_event_flag_stale 
  AFTER INSERT ON sales_events 
  FOR EACH ROW EXECUTE FUNCTION flag_recommendations_stale();

CREATE TRIGGER on_search_event_flag_stale 
  AFTER INSERT ON search_events 
  FOR EACH ROW EXECUTE FUNCTION flag_recommendations_stale();

CREATE TRIGGER on_request_flag_stale 
  AFTER INSERT ON customer_requests 
  FOR EACH ROW EXECUTE FUNCTION flag_recommendations_stale();

