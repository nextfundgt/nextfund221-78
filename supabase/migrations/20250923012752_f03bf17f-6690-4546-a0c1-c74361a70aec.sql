-- Add new columns to transactions table for UmbrellaPag integration
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS transfer_id TEXT,
ADD COLUMN IF NOT EXISTS end_to_end_id TEXT;

-- Create index for better performance on transfer_id lookups
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON public.transactions(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_qr_code_id ON public.transactions(qr_code_id);