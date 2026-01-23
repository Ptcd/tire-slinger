-- =============================================
-- FIX RLS POLICIES - Run this to fix the circular dependency issue
-- =============================================

-- First, drop the problematic policy if it exists
DROP POLICY IF EXISTS "Admins read org profiles" ON public.profiles;

-- Drop the function if it exists (we'll recreate it)
DROP FUNCTION IF EXISTS public.is_user_admin_of_org(UUID);

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION public.is_user_admin_of_org(target_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
  user_role TEXT;
BEGIN
  -- Get user's org_id and role
  -- This works because "Users read own profile" policy allows reading own profile
  SELECT org_id, role INTO user_org_id, user_role
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Return true if user is admin and in same org as target
  RETURN user_role = 'admin' AND user_org_id = target_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate the policy - only applies to OTHER users' profiles (not your own)
CREATE POLICY "Admins read org profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    -- Only apply to profiles that are NOT the current user's own profile
    auth.uid() != id
    AND
    -- And only if user is admin of the target profile's org
    org_id IS NOT NULL 
    AND public.is_user_admin_of_org(org_id)
  );

-- Verify the existing policies are still in place
-- These should already exist, but we're just documenting them here:
-- "Users read own profile" - allows auth.uid() = id
-- "Users update own profile" - allows auth.uid() = id  
-- "Superadmins read all profiles" - allows superadmins to read all

-- The key is that "Users read own profile" should work independently
-- and the new "Admins read org profiles" only applies to OTHER profiles

