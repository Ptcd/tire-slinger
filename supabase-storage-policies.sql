-- =============================================
-- SUPABASE STORAGE POLICIES
-- Run this after creating the 'tire-images' bucket in Supabase Dashboard
-- =============================================

-- Allow authenticated users to upload to their org's folder
CREATE POLICY "Org members can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tire-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

-- Allow public read access
CREATE POLICY "Public can read tire images"
ON storage.objects FOR SELECT
USING (bucket_id = 'tire-images');

-- Allow org members to delete their images
CREATE POLICY "Org members can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tire-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

