-- =============================================
-- TIRE SLINGERS - COMPLETE DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: organizations
-- =============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  -- DOT Tracking Settings (Phase 12)
  dot_tracking_enabled BOOLEAN DEFAULT FALSE,
  dot_max_age_years INTEGER DEFAULT 8,
  dot_warning_days INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: profiles
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'staff', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: tires
-- =============================================
CREATE TABLE public.tires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Size fields
  width INTEGER NOT NULL,
  aspect_ratio INTEGER NOT NULL,
  rim_diameter INTEGER NOT NULL,
  size_display TEXT GENERATED ALWAYS AS (width || '/' || aspect_ratio || 'R' || rim_diameter) STORED,
  diameter_inches NUMERIC GENERATED ALWAYS AS (rim_diameter + 2.0 * (width * aspect_ratio / 100.0) / 25.4) STORED,
  
  -- Tire details
  brand TEXT,
  model TEXT,
  tire_type TEXT DEFAULT 'all-season' CHECK (tire_type IN ('all-season', 'summer', 'winter', 'all-terrain', 'mud-terrain', 'performance')),
  condition TEXT DEFAULT 'used' CHECK (condition IN ('new', 'used', 'like-new')),
  tread_depth NUMERIC,
  
  -- DOT Date Code (Phase 12) - nullable
  dot_week INTEGER CHECK (dot_week IS NULL OR (dot_week >= 1 AND dot_week <= 53)),
  dot_year INTEGER CHECK (dot_year IS NULL OR (dot_year >= 2000 AND dot_year <= 2099)),
  
  -- Pricing and stock
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Media
  images TEXT[] DEFAULT '{}',
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tires_org_id ON public.tires(org_id);
CREATE INDEX idx_tires_size ON public.tires(width, aspect_ratio, rim_diameter);
CREATE INDEX idx_tires_rim ON public.tires(rim_diameter);
CREATE INDEX idx_tires_diameter ON public.tires(diameter_inches);
CREATE INDEX idx_tires_dot ON public.tires(dot_year, dot_week) WHERE dot_year IS NOT NULL;

-- =============================================
-- TABLE: fitment_vehicles
-- =============================================
CREATE TABLE public.fitment_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  trim TEXT,
  UNIQUE(year, make, model, trim)
);

CREATE INDEX idx_fitment_year_make ON public.fitment_vehicles(year, make);
CREATE INDEX idx_fitment_make_model ON public.fitment_vehicles(make, model);

-- =============================================
-- TABLE: fitment_tire_sizes
-- =============================================
CREATE TABLE public.fitment_tire_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES public.fitment_vehicles(id) ON DELETE CASCADE,
  width INTEGER NOT NULL,
  aspect_ratio INTEGER NOT NULL,
  rim_diameter INTEGER NOT NULL,
  is_oem BOOLEAN DEFAULT TRUE,
  UNIQUE(vehicle_id, width, aspect_ratio, rim_diameter)
);

CREATE INDEX idx_fitment_sizes_vehicle ON public.fitment_tire_sizes(vehicle_id);

-- =============================================
-- TABLE: audit_log
-- =============================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON public.audit_log(org_id);
CREATE INDEX idx_audit_created ON public.audit_log(created_at DESC);

-- =============================================
-- TABLE: external_listings (Phase 11)
-- =============================================
CREATE TABLE public.external_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tire_id UUID NOT NULL REFERENCES public.tires(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook_marketplace')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'deleted')),
  listing_url TEXT,
  listed_price NUMERIC,
  listed_quantity INTEGER,
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tire_id, platform)
);

CREATE INDEX idx_external_listings_org ON public.external_listings(org_id, platform, status);
CREATE INDEX idx_external_listings_tire ON public.external_listings(tire_id, platform);

-- =============================================
-- TABLE: external_tasks (Phase 11)
-- =============================================
CREATE TABLE public.external_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tire_id UUID NOT NULL REFERENCES public.tires(id) ON DELETE CASCADE,
  external_listing_id UUID REFERENCES public.external_listings(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook_marketplace')),
  task_type TEXT NOT NULL CHECK (task_type IN ('delete_listing', 'update_listing', 'verify_listing')),
  reason TEXT NOT NULL CHECK (reason IN ('sold_out', 'delisted', 'price_changed', 'quantity_changed', 'manual')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'dismissed')),
  priority INTEGER NOT NULL DEFAULT 2,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_external_tasks_org ON public.external_tasks(org_id, platform, status);
CREATE INDEX idx_external_tasks_tire ON public.external_tasks(tire_id, platform, status);

-- =============================================
-- TRIGGERS: updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tires_updated_at BEFORE UPDATE ON public.tires FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_external_listings_updated_at BEFORE UPDATE ON public.external_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_external_tasks_updated_at BEFORE UPDATE ON public.external_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- FUNCTION: Generate unique slug
-- =============================================
CREATE OR REPLACE FUNCTION generate_unique_slug(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := LOWER(REGEXP_REPLACE(TRIM(base_name), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Handle new user signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_signup(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  yard_name TEXT
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  new_slug TEXT;
BEGIN
  new_slug := generate_unique_slug(yard_name);
  
  INSERT INTO public.organizations (name, slug)
  VALUES (yard_name, new_slug)
  RETURNING id INTO new_org_id;
  
  INSERT INTO public.profiles (id, email, full_name, org_id, role)
  VALUES (user_id, user_email, user_name, new_org_id, 'admin');
  
  -- Seed 3 sample tires
  INSERT INTO public.tires (org_id, width, aspect_ratio, rim_diameter, brand, model, tire_type, condition, tread_depth, price, quantity, description)
  VALUES
    (new_org_id, 205, 55, 16, 'Michelin', 'Defender T+H', 'all-season', 'used', 7, 75.00, 4, 'Good condition all-season tires. Set of 4 available.'),
    (new_org_id, 265, 70, 17, 'BFGoodrich', 'All-Terrain T/A KO2', 'all-terrain', 'used', 9, 125.00, 2, 'Excellent truck/SUV tires with plenty of tread life remaining.'),
    (new_org_id, 225, 45, 18, 'Continental', 'ExtremeContact Sport', 'performance', 'like-new', 10, 150.00, 1, 'Nearly new performance tire. Great grip.');
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitment_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitment_tire_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_tasks ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Superadmins read all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- ORGANIZATIONS policies
CREATE POLICY "Users read own org" ON public.organizations FOR SELECT USING (id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Admins update own org" ON public.organizations FOR UPDATE USING (id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Superadmins read all orgs" ON public.organizations FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
CREATE POLICY "Public read orgs" ON public.organizations FOR SELECT USING (TRUE);

-- TIRES policies
CREATE POLICY "Org members read own tires" ON public.tires FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Org members insert tires" ON public.tires FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Org members update tires" ON public.tires FOR UPDATE USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Org members delete tires" ON public.tires FOR DELETE USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Public read active tires" ON public.tires FOR SELECT USING (is_active = TRUE AND quantity > 0);
CREATE POLICY "Superadmins read all tires" ON public.tires FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- AUDIT_LOG policies
CREATE POLICY "Org members read own audit" ON public.audit_log FOR SELECT USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Org members insert audit" ON public.audit_log FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- FITMENT (public read)
CREATE POLICY "Anyone read fitment vehicles" ON public.fitment_vehicles FOR SELECT USING (TRUE);
CREATE POLICY "Anyone read fitment sizes" ON public.fitment_tire_sizes FOR SELECT USING (TRUE);

-- EXTERNAL_LISTINGS policies
CREATE POLICY "Org members CRUD own listings" ON public.external_listings FOR ALL USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- EXTERNAL_TASKS policies
CREATE POLICY "Org members CRUD own tasks" ON public.external_tasks FOR ALL USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- =============================================
-- SEED FITMENT DATA
-- =============================================

-- Seed popular vehicles (2018-2024)
INSERT INTO public.fitment_vehicles (year, make, model, trim) VALUES
(2024, 'Honda', 'Civic', 'LX'), (2024, 'Honda', 'Civic', 'Sport'),
(2023, 'Honda', 'Civic', 'LX'), (2023, 'Honda', 'Civic', 'Sport'),
(2022, 'Honda', 'Civic', 'LX'), (2022, 'Honda', 'Civic', 'Sport'),
(2024, 'Honda', 'Accord', 'LX'), (2024, 'Honda', 'Accord', 'Sport'),
(2023, 'Honda', 'Accord', 'LX'), (2023, 'Honda', 'Accord', 'Sport'),
(2024, 'Honda', 'CR-V', 'LX'), (2024, 'Honda', 'CR-V', 'EX'),
(2023, 'Honda', 'CR-V', 'LX'), (2023, 'Honda', 'CR-V', 'EX'),
(2024, 'Toyota', 'Camry', 'LE'), (2024, 'Toyota', 'Camry', 'SE'),
(2023, 'Toyota', 'Camry', 'LE'), (2023, 'Toyota', 'Camry', 'SE'),
(2024, 'Toyota', 'Corolla', 'LE'), (2024, 'Toyota', 'Corolla', 'SE'),
(2023, 'Toyota', 'Corolla', 'LE'), (2023, 'Toyota', 'Corolla', 'SE'),
(2024, 'Toyota', 'RAV4', 'LE'), (2024, 'Toyota', 'RAV4', 'XLE'),
(2023, 'Toyota', 'RAV4', 'LE'), (2023, 'Toyota', 'RAV4', 'XLE'),
(2024, 'Ford', 'F-150', 'XL'), (2024, 'Ford', 'F-150', 'XLT'), (2024, 'Ford', 'F-150', 'Lariat'),
(2023, 'Ford', 'F-150', 'XL'), (2023, 'Ford', 'F-150', 'XLT'),
(2024, 'Chevrolet', 'Silverado 1500', 'WT'), (2024, 'Chevrolet', 'Silverado 1500', 'LT'),
(2023, 'Chevrolet', 'Silverado 1500', 'WT'), (2023, 'Chevrolet', 'Silverado 1500', 'LT'),
(2024, 'Dodge', 'Ram 1500', 'Tradesman'), (2024, 'Dodge', 'Ram 1500', 'Big Horn'),
(2023, 'Dodge', 'Ram 1500', 'Tradesman'), (2023, 'Dodge', 'Ram 1500', 'Big Horn'),
(2024, 'Nissan', 'Altima', 'S'), (2024, 'Nissan', 'Altima', 'SV'),
(2024, 'Subaru', 'Outback', 'Base'), (2024, 'Subaru', 'Outback', 'Premium');

-- Link tire sizes to vehicles
INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 205, 55, 16, TRUE FROM public.fitment_vehicles WHERE make = 'Honda' AND model = 'Civic' AND trim = 'LX';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 215, 50, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Honda' AND model = 'Civic' AND trim = 'Sport';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 215, 55, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Honda' AND model = 'Accord' AND trim = 'LX';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 225, 50, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Honda' AND model = 'Accord' AND trim = 'Sport';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 225, 65, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Honda' AND model = 'CR-V';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 215, 55, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Toyota' AND model = 'Camry' AND trim = 'LE';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 235, 45, 18, TRUE FROM public.fitment_vehicles WHERE make = 'Toyota' AND model = 'Camry' AND trim = 'SE';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 205, 55, 16, TRUE FROM public.fitment_vehicles WHERE make = 'Toyota' AND model = 'Corolla' AND trim = 'LE';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 225, 40, 18, TRUE FROM public.fitment_vehicles WHERE make = 'Toyota' AND model = 'Corolla' AND trim = 'SE';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 225, 65, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Toyota' AND model = 'RAV4';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 265, 70, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Ford' AND model = 'F-150' AND trim IN ('XL', 'XLT');

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 275, 65, 18, TRUE FROM public.fitment_vehicles WHERE make = 'Ford' AND model = 'F-150' AND trim = 'Lariat';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 265, 70, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Chevrolet' AND model = 'Silverado 1500';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 275, 70, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Dodge' AND model = 'Ram 1500' AND trim = 'Tradesman';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 275, 60, 20, TRUE FROM public.fitment_vehicles WHERE make = 'Dodge' AND model = 'Ram 1500' AND trim = 'Big Horn';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 215, 55, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Nissan' AND model = 'Altima';

INSERT INTO public.fitment_tire_sizes (vehicle_id, width, aspect_ratio, rim_diameter, is_oem)
SELECT id, 225, 65, 17, TRUE FROM public.fitment_vehicles WHERE make = 'Subaru' AND model = 'Outback';

-- =============================================
-- SEED DEMO YARD
-- =============================================

INSERT INTO public.organizations (id, name, slug, phone, email, address, city, state, zip, description)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Demo Tire Yard',
  'demo-yard',
  '(555) 123-4567',
  'demo@tireslingers.com',
  '123 Tire Lane',
  'Austin',
  'TX',
  '78701',
  'Welcome to our demo tire yard! We carry a wide selection of quality used tires.'
);

INSERT INTO public.tires (org_id, width, aspect_ratio, rim_diameter, brand, model, tire_type, condition, tread_depth, price, quantity, description) VALUES
('a0000000-0000-0000-0000-000000000001', 205, 55, 16, 'Michelin', 'Defender T+H', 'all-season', 'used', 7, 65.00, 8, 'Reliable all-season tires.'),
('a0000000-0000-0000-0000-000000000001', 215, 55, 17, 'Goodyear', 'Assurance WeatherReady', 'all-season', 'used', 6, 55.00, 6, 'All-weather tires.'),
('a0000000-0000-0000-0000-000000000001', 225, 65, 17, 'Continental', 'CrossContact LX25', 'all-season', 'like-new', 10, 95.00, 4, 'Nearly new SUV tires.'),
('a0000000-0000-0000-0000-000000000001', 265, 70, 17, 'BFGoodrich', 'All-Terrain T/A KO2', 'all-terrain', 'used', 8, 110.00, 5, 'Popular all-terrain truck tires.'),
('a0000000-0000-0000-0000-000000000001', 275, 65, 18, 'Nitto', 'Ridge Grappler', 'all-terrain', 'used', 9, 130.00, 4, 'Hybrid terrain tires.'),
('a0000000-0000-0000-0000-000000000001', 225, 45, 18, 'Pirelli', 'P Zero', 'performance', 'used', 5, 85.00, 2, 'High-performance summer tires.'),
('a0000000-0000-0000-0000-000000000001', 235, 45, 18, 'Bridgestone', 'Potenza Sport', 'performance', 'like-new', 11, 145.00, 3, 'Premium performance tires.'),
('a0000000-0000-0000-0000-000000000001', 215, 50, 17, 'Hankook', 'Kinergy GT', 'all-season', 'used', 6, 50.00, 7, 'Budget-friendly touring tires.'),
('a0000000-0000-0000-0000-000000000001', 245, 75, 16, 'Cooper', 'Discoverer AT3 4S', 'all-terrain', 'used', 7, 90.00, 3, 'Versatile all-terrain.'),
('a0000000-0000-0000-0000-000000000001', 275, 60, 20, 'Toyo', 'Open Country A/T III', 'all-terrain', 'new', 12, 175.00, 4, 'Brand new truck tires.');

