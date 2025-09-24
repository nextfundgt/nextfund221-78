import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Pushin Pay webhook received');
    
    const webhook = await req.json();
    console.log('Webhook data:', webhook);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the transaction by qr_code_id (transaction ID from Pushin Pay)
    const { data: transactions, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('qr_code_id', webhook.id)
      .single();

    if (findError) {
      console.error('Error finding transaction:', findError);
      return new Response('Transaction not found', { status: 404, headers: corsHeaders });
    }

    // Update transaction status based on webhook
    let newStatus = 'pending';
    if (webhook.status === 'paid') {
      newStatus = 'approved';
    } else if (webhook.status === 'expired') {
      newStatus = 'cancelled';
    }

    console.log('Updating transaction status to:', newStatus);

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: newStatus,
        processed_at: new Date().toISOString(),
        end_to_end_id: webhook.end_to_end_id || null,
        notes: webhook.payer_name ? `Pagador: ${webhook.payer_name} (${webhook.payer_national_registration})` : null
      })
      .eq('id', transactions.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw updateError;
    }

    // If payment was approved, create notification
    if (newStatus === 'approved') {
      console.log('Payment approved, creating notification for user:', transactions.user_id);
      
      await supabase
        .from('notifications')
        .insert({
          user_id: transactions.user_id,
          title: 'Pagamento Aprovado!',
          message: `Seu pagamento PIX de R$ ${transactions.amount} foi confirmado com sucesso.`,
          type: 'success'
        });
    }

    return new Response('OK', { 
      headers: corsHeaders,
      status: 200 
    });

  } catch (error) {
    console.error('Error in pushinpay-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});