import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateStats {
  level_1_count: number;
  level_2_count: number;
  level_3_count: number;
  level_4_count: number;
  level_5_count: number;
  level_6_count: number;
  level_7_count: number;
  level_8_count: number;
  level_9_count: number;
  level_10_count: number;
  level_1_earnings: number;
  level_2_earnings: number;
  level_3_earnings: number;
  level_4_earnings: number;
  level_5_earnings: number;
  level_6_earnings: number;
  level_7_earnings: number;
  level_8_earnings: number;
  level_9_earnings: number;
  level_10_earnings: number;
  total_earnings: number;
}

const defaultStats: AffiliateStats = {
  level_1_count: 0, level_2_count: 0, level_3_count: 0, level_4_count: 0, level_5_count: 0,
  level_6_count: 0, level_7_count: 0, level_8_count: 0, level_9_count: 0, level_10_count: 0,
  level_1_earnings: 0, level_2_earnings: 0, level_3_earnings: 0, level_4_earnings: 0, level_5_earnings: 0,
  level_6_earnings: 0, level_7_earnings: 0, level_8_earnings: 0, level_9_earnings: 0, level_10_earnings: 0,
  total_earnings: 0
};

export function useAffiliateData(userId?: string) {
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliateData = useMemo(() => {
    if (!userId) return () => Promise.resolve();

    return async () => {
      if (isLoading) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('affiliate_levels')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        setAffiliateStats(data || defaultStats);
        setDataFetched(true);
      } catch (err) {
        console.error('Error fetching affiliate data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAffiliateStats(defaultStats);
      } finally {
        setIsLoading(false);
      }
    };
  }, [userId, isLoading]);

  useEffect(() => {
    if (userId && !dataFetched) {
      fetchAffiliateData();
    }
  }, [userId, dataFetched, fetchAffiliateData]);

  // Memoized calculated values
  const calculatedStats = useMemo(() => {
    if (!affiliateStats) return { totalReferrals: 0, totalEarnings: 0 };

    const totalReferrals = Object.keys(affiliateStats)
      .filter(key => key.includes('_count'))
      .reduce((sum, key) => sum + (affiliateStats[key as keyof AffiliateStats] as number || 0), 0);

    const totalEarnings = affiliateStats.total_earnings || 0;

    return { totalReferrals, totalEarnings };
  }, [affiliateStats]);

  return {
    affiliateStats,
    isLoading,
    dataFetched,
    error,
    refetch: fetchAffiliateData,
    ...calculatedStats
  };
}