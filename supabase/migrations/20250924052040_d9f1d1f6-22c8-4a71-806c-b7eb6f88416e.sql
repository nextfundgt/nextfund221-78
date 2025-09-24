-- Update VIP plan prices
UPDATE public.vip_plans 
SET price = 280, updated_at = now() 
WHERE level = 2;

UPDATE public.vip_plans 
SET price = 480, updated_at = now() 
WHERE level = 3;