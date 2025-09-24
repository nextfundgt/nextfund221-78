-- Add new fields to transactions table for AbacatePay integration
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS qr_code_id text,
ADD COLUMN IF NOT EXISTS qr_code_image text,
ADD COLUMN IF NOT EXISTS pix_key text,
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS email text;