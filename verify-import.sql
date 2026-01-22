-- Check that rim_diameter is now 2 digits (14-24 range)
SELECT width, aspect_ratio, rim_diameter, size_display, COUNT(*) as cnt
FROM tire_catalog 
WHERE width IS NOT NULL
GROUP BY width, aspect_ratio, rim_diameter, size_display
ORDER BY cnt DESC
LIMIT 10;

-- Check specifically for 205/55R16
SELECT brand, model_name, size_display
FROM tire_catalog 
WHERE width = 205 AND aspect_ratio = 55 AND rim_diameter = 16
LIMIT 10;

-- Check a sample to verify rim_diameter is correct
SELECT width, aspect_ratio, rim_diameter, size_display, brand, model_name
FROM tire_catalog 
WHERE width = 235 AND aspect_ratio = 75
LIMIT 5;

