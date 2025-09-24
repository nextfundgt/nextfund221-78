import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface VideoQuestion {
  id: string;
  video_task_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  correct_option: 'a' | 'b';
  created_at: string;
  updated_at: string;
}

interface UserVideoAnswer {
  id: string;
  user_id: string;
  video_task_id: string;
  question_id: string;
  selected_option: 'a' | 'b';
  is_correct: boolean;
  answered_at: string;
}

export const useVideoQuestions = (videoTaskId?: string) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<VideoQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserVideoAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (videoTaskId) {
      fetchQuestions();
      if (user) {
        fetchUserAnswers();
      }
    }
  }, [videoTaskId, user]);

  const fetchQuestions = async () => {
    if (!videoTaskId) return;

    try {
      const { data, error } = await supabase
        .from('video_questions')
        .select('*')
        .eq('video_task_id', videoTaskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQuestions((data || []) as VideoQuestion[]);
    } catch (error) {
      console.error('Error fetching video questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnswers = async () => {
    if (!user || !videoTaskId) return;

    try {
      const { data, error } = await supabase
        .from('user_video_answers')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_task_id', videoTaskId);

      if (error) throw error;
      setUserAnswers((data || []) as UserVideoAnswer[]);
    } catch (error) {
      console.error('Error fetching user answers:', error);
    }
  };

  const submitAnswer = async (questionId: string, selectedOption: 'a' | 'b') => {
    if (!user || !videoTaskId) return null;

    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) throw new Error('Question not found');

      const isCorrect = selectedOption === question.correct_option;

      const { data, error } = await supabase
        .from('user_video_answers')
        .insert({
          user_id: user.id,
          video_task_id: videoTaskId,
          question_id: questionId,
          selected_option: selectedOption,
          is_correct: isCorrect
        })
        .select()
        .single();

      if (error) throw error;

      setUserAnswers(prev => [...prev, data as UserVideoAnswer]);
      return { isCorrect, answer: data };
    } catch (error) {
      console.error('Error submitting answer:', error);
      return null;
    }
  };

  const hasAnsweredQuestion = (questionId: string) => {
    return userAnswers.some(answer => answer.question_id === questionId);
  };

  const hasAnsweredAllQuestions = () => {
    return questions.length > 0 && questions.every(q => hasAnsweredQuestion(q.id));
  };

  const getAnswerForQuestion = (questionId: string) => {
    return userAnswers.find(answer => answer.question_id === questionId);
  };

  return {
    questions,
    userAnswers,
    loading,
    submitAnswer,
    hasAnsweredQuestion,
    hasAnsweredAllQuestions,
    getAnswerForQuestion,
    refetch: () => {
      fetchQuestions();
      if (user) fetchUserAnswers();
    }
  };
};