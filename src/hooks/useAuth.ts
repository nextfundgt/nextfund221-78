import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  balance: number;
  avatar_url: string | null;
  affiliate_code: string | null;
  referred_by: string | null;
  user_number: number;
  extra_videos_available: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(async () => {
            await fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          await fetchProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, referredBy?: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            referred_by: referredBy
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Conta criada!",
        description: "Verifique seu email para confirmar a conta.",
      });

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setProfile(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer logout.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Email enviado!",
        description: "Verifique seu email para redefinir a senha.",
      });

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string, fullName: string, referredBy?: string) => {
    try {
      // Generate affiliate code
      const affiliateCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          full_name: fullName,
          affiliate_code: affiliateCode,
          referred_by: referredBy || null,
          balance: 0
        });

      if (error) throw error;

      // Create default user role
      await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: 'user'
        });

      // Create affiliate entry
      await supabase
        .from('affiliates')
        .upsert({
          user_id: userId,
          code: affiliateCode,
          clicks_count: 0,
          signups_count: 0,
          rewards_total: 0
        });

      // If referred by someone, create referral record
      if (referredBy) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('affiliate_code', referredBy)
          .maybeSingle();

        if (referrer) {
          await supabase
            .from('affiliate_referrals')
            .insert({
              affiliate_user_id: referrer.user_id,
              referred_user_id: userId,
              reward_amount: 10 // Default reward
            });

          // Update affiliate stats
          const { data: currentAffiliate } = await supabase
            .from('affiliates')
            .select('signups_count, rewards_total')
            .eq('user_id', referrer.user_id)
            .single();

          if (currentAffiliate) {
            await supabase
              .from('affiliates')
              .update({
                signups_count: currentAffiliate.signups_count + 1,
                rewards_total: currentAffiliate.rewards_total + 10
              })
              .eq('user_id', referrer.user_id);
          }
        }
      }

      await fetchProfile(userId);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    createProfile,
    fetchProfile,
  };
}