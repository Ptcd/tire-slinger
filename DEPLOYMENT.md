# Tire Slingers - Deployment Guide

## Step 1: Set Up Supabase

1. **Create a Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Wait for it to finish provisioning

2. **Run Database Schema**
   - In Supabase Dashboard, go to **SQL Editor**
   - Open `supabase-schema.sql` from this project
   - Copy and paste the entire file into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)
   - Wait for all tables, functions, and policies to be created

3. **Create Storage Bucket**
   - Go to **Storage** in Supabase Dashboard
   - Click **New bucket**
   - Name: `tire-images`
   - Make it **Public**
   - Click **Create bucket**

4. **Add Storage Policies**
   - Go back to **SQL Editor**
   - Open `supabase-storage-policies.sql` from this project
   - Copy and paste into SQL Editor
   - Click **Run**

5. **Get Your Supabase Credentials**
   - Go to **Settings** → **API**
   - Copy these values:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon/public key** (starts with `eyJ...`)
     - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 2: Set Up Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub**
   ```bash
   cd C:\Users\onkau\tire-slingers
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click **Add New Project**
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   In Vercel project settings, add these:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   - Click **Deploy**
   - Wait for build to complete
   - Your app will be live!

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd C:\Users\onkau\tire-slingers
   vercel
   ```
   - Follow the prompts
   - When asked for environment variables, add them one by one

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add NEXT_PUBLIC_SITE_URL
   ```

5. **Redeploy with env vars**
   ```bash
   vercel --prod
   ```

## Step 3: Configure Supabase Auth

1. **Add Redirect URLs**
   - In Supabase Dashboard, go to **Authentication** → **URL Configuration**
   - Add your Vercel URL to **Site URL**: `https://your-app.vercel.app`
   - Add to **Redirect URLs**: 
     - `https://your-app.vercel.app/api/auth/callback`
     - `https://your-app.vercel.app/**`

## Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Click **Sign Up** and create a test account
3. You should be redirected to the admin dashboard
4. Check that 3 sample tires were created automatically
5. Visit `/yard/demo-yard` to see the demo storefront

## Troubleshooting

**Build fails on Vercel?**
- Check that all environment variables are set
- Check build logs for specific errors

**Auth not working?**
- Verify redirect URLs in Supabase
- Check that `NEXT_PUBLIC_SITE_URL` matches your Vercel domain

**Images not uploading?**
- Verify storage bucket is public
- Check storage policies were applied
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (for admin operations)

**Database errors?**
- Make sure you ran `supabase-schema.sql` completely
- Check RLS policies are enabled
- Verify your Supabase project is active

## Environment Variables Summary

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service role key - SECRET!)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

## Next Steps

- Customize your landing page
- Add your own branding
- Complete Phase 11 (Marketplace Helper)
- Complete Phase 12 (DOT Aging Dashboard)

