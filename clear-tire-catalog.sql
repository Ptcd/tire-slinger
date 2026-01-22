-- Delete all entries from tire_catalog (we'll re-import)
TRUNCATE TABLE tire_catalog;

-- Verify it's empty
SELECT COUNT(*) FROM tire_catalog;

