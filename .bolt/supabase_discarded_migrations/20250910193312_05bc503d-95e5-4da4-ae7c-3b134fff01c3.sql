-- Atualizar o perfil do admin com código de afiliado
UPDATE public.profiles 
SET affiliate_code = 'ADMIN001'
WHERE user_id = '271a87e4-5fc6-4da6-97aa-b328acb451f9';

-- Criar registro de afiliado para o admin  
INSERT INTO public.affiliates (user_id, code, clicks_count, signups_count, rewards_total)
VALUES (
  '271a87e4-5fc6-4da6-97aa-b328acb451f9',
  'ADMIN001', 
  0, 
  0, 
  0.00
)
ON CONFLICT (user_id) DO NOTHING;