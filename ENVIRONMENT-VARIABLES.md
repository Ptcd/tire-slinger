# Environment Variables Required

## Where to Find These Values

All values come from your **Supabase Dashboard** → **Settings** → **API**

## Required Environment Variables

### 1. NEXT_PUBLIC_SUPABASE_URL
**Location**: Supabase Dashboard → Settings → API → Project URL  
**Example**: `https://xxxxxxxxxxxxx.supabase.co`  
**Usage**: Public URL for your Supabase project (safe to expose in client-side code)

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
**Location**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`  
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  
**Usage**: Public anonymous key (safe to expose, protected by RLS)

### 3. SUPABASE_SERVICE_ROLE_KEY
**Location**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`  
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  
**Usage**: Service role key (KEEP SECRET! Only use server-side)  
**⚠️ WARNING**: Never expose this in client-side code!

### 4. NEXT_PUBLIC_SITE_URL
**Location**: Your Vercel deployment URL (after first deploy)  
**Example**: `https://tire-slingers.vercel.app`  
**Usage**: Base URL of your application (for redirects, callbacks, etc.)

## How to Get Them

### Step 1: Get Supabase Values
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon) in left sidebar
4. Click **API** under Project Settings
5. You'll see:
   - **Project URL** → Copy this for `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys** section:
     - `anon` `public` → Copy this for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` `secret` → Click "Reveal" and copy for `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Get Site URL (After Vercel Deploy)
1. Deploy to Vercel first
2. Vercel will give you a URL like `https://tire-slingers.vercel.app`
3. Use that for `NEXT_PUBLIC_SITE_URL`

## For Local Development (.env.local)

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## For Vercel Deployment

Add these in Vercel Dashboard → Your Project → Settings → Environment Variables:

1. `NEXT_PUBLIC_SUPABASE_URL` = (from Supabase)
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Supabase)
3. `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase)
4. `NEXT_PUBLIC_SITE_URL` = (your Vercel URL after first deploy)

## Quick SQL to Verify Setup

Run `check-setup.sql` to verify your database is configured correctly.

