import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useExtraVideos() {
  const { profile, fetchProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const consumeExtraVideo = useCallback(async () => {
    if (!profile?.user_id || (profile.extra_videos_available || 0) <= 0) {
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          extra_videos_available: (profile.extra_videos_available || 0) - 1 
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      // Refresh profile to get updated extra videos count
      await fetchProfile(profile.user_id);
      
      toast({
        title: "Vídeo Extra Usado",
        description: `Você tem ${(profile.extra_videos_available || 0) - 1} vídeos extras restantes.`,
      });

      return true;
    } catch (error) {
      console.error('Error consuming extra video:', error);
      toast({
        title: "Erro",
        description: "Não foi possível usar o vídeo extra.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, fetchProfile, toast]);

  const canWatchExtraVideo = useCallback(() => {
    return (profile?.extra_videos_available || 0) > 0;
  }, [profile?.extra_videos_available]);

  return {
    extraVideosAvailable: profile?.extra_videos_available || 0,
    consumeExtraVideo,
    canWatchExtraVideo,
    loading
  };
}