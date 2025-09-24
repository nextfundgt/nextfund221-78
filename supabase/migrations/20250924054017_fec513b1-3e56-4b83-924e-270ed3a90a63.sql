-- Enable realtime for missing tables
ALTER TABLE public.video_tasks REPLICA IDENTITY FULL;
ALTER TABLE public.user_video_completions REPLICA IDENTITY FULL;
ALTER TABLE public.user_levels REPLICA IDENTITY FULL;
ALTER TABLE public.vip_plans REPLICA IDENTITY FULL;
ALTER TABLE public.user_vip_subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.marketing_banners REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_video_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_vip_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_banners;