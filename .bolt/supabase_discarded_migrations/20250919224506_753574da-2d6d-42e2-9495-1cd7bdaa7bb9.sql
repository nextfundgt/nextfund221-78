-- Clean up invalid investment records with empty user_id
DELETE FROM public.investment_plans 
WHERE user_id = '00000000-0000-0000-0000-000000000000' 
   OR user_id IS NULL;