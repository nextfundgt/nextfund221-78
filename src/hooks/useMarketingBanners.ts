import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketingBanner {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  button_text: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useMarketingBanners() {
  const [banners, setBanners] = useState<MarketingBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      console.log('Fetching real marketing banners from Supabase...');
      
      const { data, error } = await supabase
        .from('marketing_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      console.log('Fetched marketing banners:', data?.length || 0, 'records');
      setBanners((data as MarketingBanner[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar banners');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBanners();
      setLoading(false);
    };

    loadData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('marketing_banners_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketing_banners'
        },
        (payload) => {
          console.log('Marketing banner realtime update:', payload);
          fetchBanners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    banners,
    loading,
    error,
    refetch: fetchBanners
  };
}