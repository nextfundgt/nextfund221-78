-- Add more VIP video tasks with different levels and better rewards
INSERT INTO public.video_tasks (
  title, description, video_url, thumbnail_url, duration_seconds, 
  reward_amount, category, is_premium, vip_level_required, status
) VALUES
  -- VIP Level 1 Videos
  ('Estratégias de Investimento Básicas', 'Aprenda as estratégias fundamentais para começar a investir', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop', 180, 5.00, 'investment', true, 1, 'active'),
  ('Análise de Mercado VIP', 'Entenda como analisar o mercado como um profissional', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=225&fit=crop', 240, 6.00, 'analysis', true, 1, 'active'),
  ('Diversificação de Portfolio', 'Como diversificar seus investimentos de forma inteligente', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop', 200, 5.50, 'investment', true, 1, 'active'),
  
  -- VIP Level 2 Videos
  ('Trading Avançado - Scalping', 'Técnicas avançadas de scalping para day traders', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=225&fit=crop', 300, 8.00, 'trading', true, 2, 'active'),
  ('Análise Técnica Profissional', 'Domine os gráficos e indicadores como um pro trader', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop', 360, 9.00, 'analysis', true, 2, 'active'),
  ('Gestão de Risco Avançada', 'Como proteger seu capital com técnicas profissionais', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=225&fit=crop', 280, 7.50, 'risk', true, 2, 'active'),
  
  -- VIP Level 3 Videos (Premium)
  ('Estratégias Institucionais', 'Aprenda como os grandes fundos operam no mercado', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=400&h=225&fit=crop', 420, 12.00, 'institutional', true, 3, 'active'),
  ('Arbitragem e Algoritmos', 'Técnicas de arbitragem e trading algorítmico', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=225&fit=crop', 480, 15.00, 'advanced', true, 3, 'active'),
  ('Mercados Internacionais VIP', 'Como operar em mercados globais com estratégias exclusivas', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop', 390, 13.50, 'international', true, 3, 'active'),
  
  -- More Free Videos
  ('Introdução ao Mercado Financeiro', 'Conceitos básicos sobre investimentos', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=225&fit=crop', 120, 2.50, 'basics', false, 0, 'active'),
  ('Como Começar a Investir', 'Primeiro passo para entrar no mundo dos investimentos', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=225&fit=crop', 150, 3.00, 'basics', false, 0, 'active'),
  ('Tipos de Investimento', 'Conheça os principais tipos de investimento disponíveis', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop', 180, 3.50, 'basics', false, 0, 'active'),
  ('Planejamento Financeiro', 'Como organizar suas finanças pessoais', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=225&fit=crop', 200, 4.00, 'planning', false, 0, 'active');

-- Update existing video tasks with better thumbnails and categories
UPDATE public.video_tasks 
SET 
  thumbnail_url = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop',
  category = 'basics'
WHERE thumbnail_url IS NULL OR thumbnail_url = '';

-- Add view count tracking
UPDATE public.video_tasks SET view_count = FLOOR(RANDOM() * 1000 + 50) WHERE view_count = 0;