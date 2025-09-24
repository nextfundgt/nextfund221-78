-- Reset all existing videos to NOT be admin-created
-- This ensures only videos uploaded via admin panel after this change will appear
UPDATE public.video_tasks 
SET created_by_admin = false 
WHERE id IS NOT NULL;

-- Now only videos created via admin panel going forward will have created_by_admin = true