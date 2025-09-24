-- Create expert_profiles table
CREATE TABLE public.expert_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  initials TEXT NOT NULL,
  bio TEXT,
  experience_years INTEGER,
  total_return NUMERIC DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expert_investment_plans table
CREATE TABLE public.expert_investment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'premium', 'vip')),
  min_amount NUMERIC NOT NULL,
  daily_rate NUMERIC NOT NULL,
  previous_rate NUMERIC,
  annual_rate NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('high-return', 'stable-profits', 'beginners')),
  badge TEXT,
  participants INTEGER DEFAULT 0,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_investment_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for expert_profiles (public read access)
CREATE POLICY "Anyone can view active expert profiles" 
ON public.expert_profiles 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Admins can manage expert profiles" 
ON public.expert_profiles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for expert_investment_plans (public read access)
CREATE POLICY "Anyone can view active investment plans" 
ON public.expert_investment_plans 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Admins can manage investment plans" 
ON public.expert_investment_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert expert profiles
INSERT INTO public.expert_profiles (name, initials, bio, experience_years, total_return, success_rate, followers_count) VALUES
('Carlos Silva', 'CS', 'Especialista em criptomoedas com foco em investimentos de alto retorno', 8, 2847.5, 92.4, 15420),
('Ana Santos', 'AS', 'Analista financeira especializada em investimentos estáveis e seguros', 12, 1923.8, 89.7, 12380),
('Roberto Lima', 'RL', 'Expert em day trading e estratégias de curto prazo', 6, 3421.2, 87.3, 9850),
('Marina Costa', 'MC', 'Consultora em investimentos para iniciantes e portfolios diversificados', 10, 2156.9, 94.1, 18720),
('Felipe Oliveira', 'FO', 'Especialista em fundos imobiliários e renda fixa', 15, 1789.4, 91.8, 11250);

-- Insert expert investment plans
WITH expert_data AS (
  SELECT id, name, initials FROM public.expert_profiles
)
INSERT INTO public.expert_investment_plans (
  expert_id, name, plan_type, min_amount, daily_rate, previous_rate, annual_rate, 
  duration_days, description, category, badge, participants, risk_level
)
SELECT 
  e.id,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 'Cripto Pro Max'
    WHEN e.name = 'Ana Santos' THEN 'Renda Estável Plus'
    WHEN e.name = 'Roberto Lima' THEN 'Day Trade Expert'
    WHEN e.name = 'Marina Costa' THEN 'Iniciante Seguro'
    WHEN e.name = 'Felipe Oliveira' THEN 'Fundos Premium'
  END as name,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 'premium'
    WHEN e.name = 'Ana Santos' THEN 'starter'
    WHEN e.name = 'Roberto Lima' THEN 'vip'
    WHEN e.name = 'Marina Costa' THEN 'starter'
    WHEN e.name = 'Felipe Oliveira' THEN 'premium'
  END as plan_type,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 500
    WHEN e.name = 'Ana Santos' THEN 100
    WHEN e.name = 'Roberto Lima' THEN 1000
    WHEN e.name = 'Marina Costa' THEN 50
    WHEN e.name = 'Felipe Oliveira' THEN 300
  END as min_amount,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 0.085
    WHEN e.name = 'Ana Santos' THEN 0.045
    WHEN e.name = 'Roberto Lima' THEN 0.12
    WHEN e.name = 'Marina Costa' THEN 0.035
    WHEN e.name = 'Felipe Oliveira' THEN 0.065
  END as daily_rate,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 0.078
    WHEN e.name = 'Ana Santos' THEN 0.041
    WHEN e.name = 'Roberto Lima' THEN 0.115
    WHEN e.name = 'Marina Costa' THEN 0.032
    WHEN e.name = 'Felipe Oliveira' THEN 0.059
  END as previous_rate,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 847.5
    WHEN e.name = 'Ana Santos' THEN 423.8
    WHEN e.name = 'Roberto Lima' THEN 1421.2
    WHEN e.name = 'Marina Costa' THEN 356.9
    WHEN e.name = 'Felipe Oliveira' THEN 589.4
  END as annual_rate,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 30
    WHEN e.name = 'Ana Santos' THEN 60
    WHEN e.name = 'Roberto Lima' THEN 15
    WHEN e.name = 'Marina Costa' THEN 90
    WHEN e.name = 'Felipe Oliveira' THEN 45
  END as duration_days,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 'Investimento focado em criptomoedas de alto potencial com estratégias avançadas'
    WHEN e.name = 'Ana Santos' THEN 'Portfolio balanceado com foco em estabilidade e crescimento consistente'
    WHEN e.name = 'Roberto Lima' THEN 'Operações de alta frequência com análise técnica avançada'
    WHEN e.name = 'Marina Costa' THEN 'Estratégia segura e educativa para novos investidores'
    WHEN e.name = 'Felipe Oliveira' THEN 'Diversificação em fundos imobiliários e renda fixa premium'
  END as description,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 'high-return'
    WHEN e.name = 'Ana Santos' THEN 'stable-profits'
    WHEN e.name = 'Roberto Lima' THEN 'high-return'
    WHEN e.name = 'Marina Costa' THEN 'beginners'
    WHEN e.name = 'Felipe Oliveira' THEN 'stable-profits'
  END as category,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 'TOP PERFORMER'
    WHEN e.name = 'Ana Santos' THEN 'MAIS SEGURO'
    WHEN e.name = 'Roberto Lima' THEN 'ALTO RETORNO'
    WHEN e.name = 'Marina Costa' THEN 'INICIANTES'
    WHEN e.name = 'Felipe Oliveira' THEN 'BALANCEADO'
  END as badge,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 1247
    WHEN e.name = 'Ana Santos' THEN 2891
    WHEN e.name = 'Roberto Lima' THEN 567
    WHEN e.name = 'Marina Costa' THEN 3421
    WHEN e.name = 'Felipe Oliveira' THEN 1823
  END as participants,
  CASE 
    WHEN e.name = 'Carlos Silva' THEN 'high'
    WHEN e.name = 'Ana Santos' THEN 'low'
    WHEN e.name = 'Roberto Lima' THEN 'high'
    WHEN e.name = 'Marina Costa' THEN 'low'
    WHEN e.name = 'Felipe Oliveira' THEN 'medium'
  END as risk_level
FROM expert_data e;

-- Add triggers for updated_at
CREATE TRIGGER update_expert_profiles_updated_at
BEFORE UPDATE ON public.expert_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expert_investment_plans_updated_at
BEFORE UPDATE ON public.expert_investment_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();