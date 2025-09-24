import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserPreferences {
  id?: string;
  user_id: string;
  show_balance: boolean;
  dark_theme: boolean;
  animations_enabled: boolean;
  sounds_enabled: boolean;
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_sms: boolean;
  notifications_marketing: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user preferences
  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let { data: existingPrefs, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        return;
      }

      // If no preferences exist, create default ones
      if (!existingPrefs) {
        const defaultPrefs = {
          user_id: user.id,
          show_balance: true,
          dark_theme: false,
          animations_enabled: true,
          sounds_enabled: true,
          notifications_email: true,
          notifications_push: true,
          notifications_sms: false,
          notifications_marketing: false,
        };

        const { data, error: insertError } = await supabase
          .from('user_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating preferences:', insertError);
          return;
        }

        existingPrefs = data;
      }

      setPreferences(existingPrefs);
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update a specific preference
  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating preference:', error);
        toast.error('Erro ao salvar configuração');
        return;
      }

      setPreferences(data);
      toast.success('Configuração salva com sucesso');
    } catch (error) {
      console.error('Error in updatePreference:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  // Update multiple preferences at once
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        toast.error('Erro ao salvar configurações');
        return;
      }

      setPreferences(data);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_preferences_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setPreferences(payload.new as UserPreferences);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    preferences,
    loading,
    updatePreference,
    updatePreferences,
    refetch: fetchPreferences,
  };
};