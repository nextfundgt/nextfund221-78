-- Add name and cpf columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN name TEXT,
ADD COLUMN cpf TEXT;