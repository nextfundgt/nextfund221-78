import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  required_fields: string[];
  is_active: boolean;
  priority: number;
  api_endpoint?: string;
  webhook_url?: string;
}

interface UserPaymentPreference {
  id: string;
  user_id: string;
  preferred_gateway_id: string;
  payment_gateways?: PaymentGateway;
}

export function usePaymentGateways() {
  const { user } = useAuth();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [userPreference, setUserPreference] = useState<UserPaymentPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      
      const processedGateways = (data || []).map(gateway => ({
        ...gateway,
        required_fields: Array.isArray(gateway.required_fields) 
          ? gateway.required_fields 
          : JSON.parse(gateway.required_fields as string)
      })) as PaymentGateway[];
      
      setGateways(processedGateways);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar gateways');
    }
  };

  const fetchUserPreference = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_payment_preferences')
        .select(`
          *,
          payment_gateways (*)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.payment_gateways) {
        const processedData = {
          ...data,
          payment_gateways: {
            ...data.payment_gateways,
            required_fields: Array.isArray(data.payment_gateways.required_fields)
              ? data.payment_gateways.required_fields as string[]
              : JSON.parse(data.payment_gateways.required_fields as string) as string[]
          }
        } as UserPaymentPreference;
        setUserPreference(processedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar preferências');
    }
  };

  const getRecommendedGateway = (): PaymentGateway | null => {
    // If user has a preference and it's active, return it
    if (userPreference?.payment_gateways) {
      const preferredGateway = gateways.find(g => g.id === userPreference.preferred_gateway_id);
      if (preferredGateway && preferredGateway.is_active) {
        return preferredGateway;
      }
    }

    // Otherwise, return highest priority active gateway
    return gateways.length > 0 ? gateways[0] : null;
  };

  const savePreference = async (gatewayId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_payment_preferences')
        .upsert({
          user_id: user.id,
          preferred_gateway_id: gatewayId
        })
        .select(`
          *,
          payment_gateways (*)
        `)
        .single();

      if (error) throw error;
      
      if (data?.payment_gateways) {
        const processedData = {
          ...data,
          payment_gateways: {
            ...data.payment_gateways,
            required_fields: Array.isArray(data.payment_gateways.required_fields)
              ? data.payment_gateways.required_fields as string[]
              : JSON.parse(data.payment_gateways.required_fields as string) as string[]
          }
        } as UserPaymentPreference;
        setUserPreference(processedData);
      }
      
      return { success: true };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao salvar preferência');
    }
  };

  const initiatePayment = async (gatewayId: string, amount: number, paymentData: Record<string, any>) => {
    const gateway = gateways.find(g => g.id === gatewayId);
    if (!gateway) {
      throw new Error('Gateway não encontrado');
    }

    // Validate required fields
    const missingFields = gateway.required_fields.filter(field => !paymentData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    try {
      // Here you would integrate with the actual payment gateway
      // For now, we'll simulate the payment process
      
      if (gateway.provider === 'pushinpay') {
        // Integration with existing PushinPay checkout
        const { data, error } = await supabase.functions.invoke('pushinpay-checkout', {
          body: {
            amount,
            ...paymentData
          }
        });

        if (error) throw error;
        return data;
      }

      // For other gateways, you would implement their specific integration
      throw new Error(`Integração para ${gateway.provider} ainda não implementada`);
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    }
  };

  const hasMultipleGateways = () => {
    return gateways.length > 1;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchGateways(), fetchUserPreference()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    gateways,
    userPreference,
    loading,
    error,
    getRecommendedGateway,
    savePreference,
    initiatePayment,
    hasMultipleGateways,
    refetch: () => Promise.all([fetchGateways(), fetchUserPreference()])
  };
}
