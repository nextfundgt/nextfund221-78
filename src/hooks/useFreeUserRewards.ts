import { useRealtimeUserLevel } from './useRealtimeUserLevel';

/**
 * Hook para gerenciar recompensas progressivas de usuários Free
 * Sistema fixo: R$15,00 total para 8 vídeos
 * - Vídeos 1-7: R$2,00 cada
 * - Vídeo 8: R$1,00
 */
export function useFreeUserRewards() {
  const { userLevel } = useRealtimeUserLevel();

  // Calcular recompensa baseada na posição do vídeo
  const calculateRewardForPosition = (videoPosition: number): number => {
    if (videoPosition < 1 || videoPosition > 8) return 0;
    
    // Vídeos 1-7: R$2,00 cada
    if (videoPosition <= 7) return 2.00;
    
    // Vídeo 8: R$1,00 para completar R$15,00
    if (videoPosition === 8) return 1.00;
    
    return 0;
  };

  // Calcular próxima recompensa baseada no progresso atual
  const getNextVideoReward = (): number => {
    if (!userLevel) return 0;
    const nextPosition = userLevel.daily_tasks_completed + 1;
    return calculateRewardForPosition(nextPosition);
  };

  // Calcular total ganho até agora
  const getCurrentEarnings = (): number => {
    if (!userLevel) return 0;
    
    let total = 0;
    for (let i = 1; i <= userLevel.daily_tasks_completed; i++) {
      total += calculateRewardForPosition(i);
    }
    return total;
  };

  // Calcular total restante a ser ganho
  const getRemainingEarnings = (): number => {
    const totalPossible = 15.00;
    const currentEarnings = getCurrentEarnings();
    return Math.max(0, totalPossible - currentEarnings);
  };

  // Obter informações de progresso para exibição
  const getProgressInfo = () => {
    if (!userLevel) return null;

    const videosCompleted = userLevel.daily_tasks_completed;
    const videosRemaining = Math.max(0, 8 - videosCompleted);
    const currentEarnings = getCurrentEarnings();
    const nextReward = getNextVideoReward();
    const remainingEarnings = getRemainingEarnings();

    return {
      videosCompleted,
      videosRemaining,
      totalVideos: 8,
      currentEarnings,
      nextReward,
      remainingEarnings,
      totalPossible: 15.00,
      progressPercentage: (videosCompleted / 8) * 100,
      canWatchMore: videosRemaining > 0,
      isComplete: videosCompleted >= 8
    };
  };

  return {
    calculateRewardForPosition,
    getNextVideoReward,
    getCurrentEarnings,
    getRemainingEarnings,
    getProgressInfo
  };
}