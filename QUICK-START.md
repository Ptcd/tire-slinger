# Quick Start Guide

## SQL Files to Run in Supabase

1. **`supabase-schema.sql`** - Run this FIRST in Supabase SQL Editor
   - Creates all tables, functions, triggers, RLS policies
   - Seeds fitment data and demo yard
   - This is the complete database schema

2. **`supabase-storage-policies.sql`** - Run this AFTER creating the storage bucket
   - First: Create bucket named `tire-images` (Public) in Storage section
   - Then: Run this SQL to add storage policies

## Vercel Deployment Steps

### 1. Push to GitHub
```bash
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repo
4. Add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
   - `NEXT_PUBLIC_SITE_URL` = https://your-app.vercel.app
5. Click Deploy

### 3. Configure Supabase Auth
- Go to Supabase Dashboard → Authentication → URL Configuration
- Add your Vercel URL to Site URL
- Add `https://your-app.vercel.app/api/auth/callback` to Redirect URLs

## That's It!

Your app should now be live. Visit your Vercel URL and sign up to test!

