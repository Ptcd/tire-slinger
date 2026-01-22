-- =============================================
-- SETUP VERIFICATION QUERY
-- Run this to verify your database is set up correctly
-- =============================================

-- Check if all tables exist
SELECT 
  'Tables Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✓ All tables created'
    ELSE '✗ Missing tables'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'organizations', 'profiles', 'tires', 'fitment_vehicles', 
    'fitment_tire_sizes', 'audit_log', 'external_listings', 'external_tasks'
  );

-- Check if functions exist
SELECT 
  'Functions Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✓ All functions created'
    ELSE '✗ Missing functions'
  END as status
FROM pg_proc 
WHERE proname IN ('generate_unique_slug', 'handle_new_user_signup', 'update_updated_at');

-- Check if demo yard exists
SELECT 
  'Demo Yard Check' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 1 THEN '✓ Demo yard created'
    ELSE '✗ Demo yard missing'
  END as status
FROM public.organizations 
WHERE slug = 'demo-yard';

-- Check if fitment data exists
SELECT 
  'Fitment Data Check' as check_type,
  COUNT(*) as vehicle_count,
  (SELECT COUNT(*) FROM public.fitment_tire_sizes) as tire_size_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ Fitment data seeded'
    ELSE '✗ No fitment data'
  END as status
FROM public.fitment_vehicles;

-- Check RLS is enabled
SELECT 
  'RLS Check' as check_type,
  COUNT(*) as tables_with_rls,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✓ RLS enabled on all tables'
    ELSE '✗ Some tables missing RLS'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'organizations', 'profiles', 'tires', 'fitment_vehicles', 
    'fitment_tire_sizes', 'audit_log', 'external_listings', 'external_tasks'
  )
  AND rowsecurity = true;

-- Summary
SELECT 
  '=== SETUP SUMMARY ===' as summary,
  'If all checks show ✓, your database is ready!' as message;

