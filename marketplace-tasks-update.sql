-- Update external_tasks table to allow new task types and reasons
-- Run this in Supabase SQL Editor

-- Update task_type constraint
ALTER TABLE external_tasks DROP CONSTRAINT IF EXISTS external_tasks_task_type_check;
ALTER TABLE external_tasks ADD CONSTRAINT external_tasks_task_type_check 
  CHECK (task_type IN ('create_listing', 'delete_listing', 'update_listing', 'verify_listing'));

-- Update reason constraint
ALTER TABLE external_tasks DROP CONSTRAINT IF EXISTS external_tasks_reason_check;
ALTER TABLE external_tasks ADD CONSTRAINT external_tasks_reason_check 
  CHECK (reason IN ('new_tire', 'sold_out', 'deleted', 'deactivated', 'delisted', 'price_changed', 'quantity_changed', 'manual'));

-- Verify the changes
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'external_tasks'::regclass
AND conname LIKE '%task_type%' OR conname LIKE '%reason%';

