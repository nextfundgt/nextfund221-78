-- Add created_by_admin column to video_tasks table
ALTER TABLE public.video_tasks 
ADD COLUMN created_by_admin boolean NOT NULL DEFAULT false;

-- Update existing videos to be marked as admin-created (assuming they are from admin)
UPDATE public.video_tasks 
SET created_by_admin = true 
WHERE status = 'active';

-- Create index for better performance on the new column
CREATE INDEX idx_video_tasks_created_by_admin ON public.video_tasks(created_by_admin, status);