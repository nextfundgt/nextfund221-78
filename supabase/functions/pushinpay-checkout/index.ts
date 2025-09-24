import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  valor: number;
  descricao: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, telefone, email, cpf, valor, descricao }: CheckoutRequest = await req.json();
    
    const pushinPayApiKey = Deno.env.get('PUSHIN_PAY_API_KEY');

    if (!pushinPayApiKey) {
      console.error('Pushin Pay API key not found');
      return new Response(
        JSON.stringify({ error: 'Credenciais Pushin Pay não configuradas' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Converter valor para centavos (API espera valor em centavos)
    const valorEmCentavos = Math.round(valor * 100);
    
    console.log('Creating Pushin Pay QR code for:', { nome, email, valor, valorEmCentavos });

    // Criar PIX via Pushin Pay API
    const pushinPayResponse = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pushinPayApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: valorEmCentavos,
        webhook_url: `https://zxfvgxevptagiksicupn.supabase.co/functions/v1/pushinpay-webhook`,
        split_rules: []
      }),
    });

    if (!pushinPayResponse.ok) {
      const errorData = await pushinPayResponse.text();
      console.error('Pushin Pay API error:', pushinPayResponse.status, errorData);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar QR code. Verifique as credenciais da API.' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pushinPayData = await pushinPayResponse.json();
    
    console.log('Pushin Pay QR code created successfully:', pushinPayData);

    return new Response(
      JSON.stringify({
        qrCode: pushinPayData.qr_code_base64, // Imagem em base64
        pixKey: pushinPayData.qr_code, // Código PIX copia e cola
        transactionId: pushinPayData.id,
        status: pushinPayData.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pushinpay-checkout function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});