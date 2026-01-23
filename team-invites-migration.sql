-- =============================================
-- TEAM INVITES TABLE
-- Run this in Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_invites_org_id ON public.team_invites(org_id);
CREATE INDEX idx_team_invites_token ON public.team_invites(token) WHERE accepted_at IS NULL;
CREATE INDEX idx_team_invites_email ON public.team_invites(email) WHERE accepted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER update_team_invites_updated_at 
  BEFORE UPDATE ON public.team_invites 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_invites
-- Org admins can read invites for their org
CREATE POLICY "Admins read own org invites" 
  ON public.team_invites 
  FOR SELECT 
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy for profiles (allow admins to see org members)
-- This policy allows admins to read profiles of OTHER users in their organization
-- Note: Users can already read their own profile via "Users read own profile" policy
-- We use SECURITY DEFINER function to avoid circular dependency when checking admin status
CREATE OR REPLACE FUNCTION public.is_user_admin_of_org(target_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
  user_role TEXT;
BEGIN
  -- Get user's org_id and role (this works because user can read their own profile)
  SELECT org_id, role INTO user_org_id, user_role
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Return true if user is admin and in same org as target
  RETURN user_role = 'admin' AND user_org_id = target_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins read org profiles" ON public.profiles;

-- Create the policy - only applies to OTHER users' profiles (not your own)
-- Your own profile is already covered by "Users read own profile" policy
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

-- Org admins can create invites for their org
CREATE POLICY "Admins create invites for own org" 
  ON public.team_invites 
  FOR INSERT 
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can read an invite by token (for validation during signup)
CREATE POLICY "Anyone can read invite by token" 
  ON public.team_invites 
  FOR SELECT 
  USING (TRUE);

-- Function to generate secure invite token
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to accept invite and create profile
CREATE OR REPLACE FUNCTION accept_team_invite(
  invite_token TEXT,
  user_id UUID,
  user_email TEXT,
  user_name TEXT
)
RETURNS UUID AS $$
DECLARE
  invite_record RECORD;
  new_org_id UUID;
BEGIN
  -- Get invite
  SELECT * INTO invite_record
  FROM public.team_invites
  WHERE token = invite_token
    AND accepted_at IS NULL
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, org_id, role)
  VALUES (user_id, user_email, user_name, invite_record.org_id, invite_record.role)
  ON CONFLICT (id) DO UPDATE
  SET 
    org_id = invite_record.org_id,
    role = invite_record.role,
    email = user_email,
    full_name = user_name,
    updated_at = NOW();
  
  -- Mark invite as accepted
  UPDATE public.team_invites
  SET accepted_at = NOW()
  WHERE id = invite_record.id;
  
  RETURN invite_record.org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

