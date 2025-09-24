import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useVideoQuestions } from '@/hooks/useVideoQuestions';
import { CheckCircle, XCircle, Play, Award } from 'lucide-react';
import { toast } from "sonner";

interface VideoQuestionsFlowProps {
  videoTaskId: string;
  videoTitle: string;
  rewardAmount: number;
  onComplete: (earnedReward: number) => void;
}

export function VideoQuestionsFlow({
  videoTaskId,
  videoTitle,
  rewardAmount,
  onComplete
}: VideoQuestionsFlowProps) {
  const {
    questions,
    loading,
    submitAnswer,
    hasAnsweredQuestion,
    hasAnsweredAllQuestions,
    getAnswerForQuestion
  } = useVideoQuestions(videoTaskId);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if all questions are already answered
    if (questions.length > 0 && hasAnsweredAllQuestions()) {
      setShowResults(true);
    }
  }, [questions, hasAnsweredAllQuestions]);

  const handleAnswerSubmit = async (questionId: string, selectedOption: 'a' | 'b') => {
    const result = await submitAnswer(questionId, selectedOption);
    
    if (result) {
      setAnsweredQuestions(prev => new Set([...prev, questionId]));
      
      // Show feedback
      if (result.isCorrect) {
        toast.success('Resposta correta! ✅');
      } else {
        toast.error('Resposta incorreta ❌');
      }

      // Move to next question after a short delay
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // All questions answered
          setShowResults(true);
          // Always give reward regardless of correct answers
          onComplete(rewardAmount);
          toast.success(`Vídeo concluído! Você ganhou R$ ${rewardAmount.toFixed(2)}`);
        }
      }, 1500);
    }
  };

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex];
  };

  const getAnswerStats = () => {
    let correct = 0;
    let total = 0;
    
    questions.forEach(question => {
      const answer = getAnswerForQuestion(question.id);
      if (answer) {
        total++;
        if (answer.is_correct) correct++;
      }
    });
    
    return { correct, total };
  };

  if (loading) {
    return (
      <Card className="glass-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="glass-card border-border">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Play className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma pergunta configurada
          </h3>
          <p className="text-muted-foreground text-center">
            Este vídeo não possui perguntas. Você ainda receberá a recompensa!
          </p>
          <Button 
            onClick={() => onComplete(rewardAmount)} 
            className="mt-4"
          >
            Receber Recompensa (R$ {rewardAmount.toFixed(2)})
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const stats = getAnswerStats();
    const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    
    return (
      <Card className="glass-card border-border">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            <Award className="h-16 w-16 text-success" />
          </div>
          <CardTitle className="text-2xl text-foreground">
            Vídeo Concluído!
          </CardTitle>
          <p className="text-muted-foreground">
            {videoTitle}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-success mb-2">
              R$ {rewardAmount.toFixed(2)}
            </div>
            <p className="text-muted-foreground">
              Recompensa recebida
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Resumo das Respostas
            </h3>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.total}
                </div>
                <p className="text-sm text-muted-foreground">Respondidas</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {stats.correct}
                </div>
                <p className="text-sm text-muted-foreground">Corretas</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {accuracy.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">Precisão</p>
              </div>
            </div>

            <div className="space-y-2">
              {questions.map((question, index) => {
                const answer = getAnswerForQuestion(question.id);
                return (
                  <div key={question.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        Pergunta {index + 1}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {question.question_text}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {answer ? (
                        <>
                          <Badge variant={answer.is_correct ? 'default' : 'secondary'}>
                            Opção {answer.selected_option.toUpperCase()}
                          </Badge>
                          {answer.is_correct ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                        </>
                      ) : (
                        <Badge variant="outline">Não respondida</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const userAnswer = getAnswerForQuestion(currentQuestion?.id);
  const isAnswered = hasAnsweredQuestion(currentQuestion?.id);

  return (
    <Card className="glass-card border-border">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-xl text-foreground">
            Responda as Perguntas
          </CardTitle>
          <Badge variant="outline">
            {currentQuestionIndex + 1} de {questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {currentQuestion && (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {currentQuestion.question_text}
              </h3>
              
              <div className="space-y-3">
                <Button
                  variant={userAnswer?.selected_option === 'a' ? 
                    (userAnswer.is_correct ? 'default' : 'destructive') : 
                    'outline'
                  }
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={() => handleAnswerSubmit(currentQuestion.id, 'a')}
                  disabled={isAnswered}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-sm">A</span>
                    </div>
                    <span className="flex-1">{currentQuestion.option_a}</span>
                    {userAnswer?.selected_option === 'a' && (
                      userAnswer.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )
                    )}
                  </div>
                </Button>
                
                <Button
                  variant={userAnswer?.selected_option === 'b' ? 
                    (userAnswer.is_correct ? 'default' : 'destructive') : 
                    'outline'
                  }
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={() => handleAnswerSubmit(currentQuestion.id, 'b')}
                  disabled={isAnswered}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-sm">B</span>
                    </div>
                    <span className="flex-1">{currentQuestion.option_b}</span>
                    {userAnswer?.selected_option === 'b' && (
                      userAnswer.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )
                    )}
                  </div>
                </Button>
              </div>

              {isAnswered && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground text-center">
                    {userAnswer?.is_correct 
                      ? '✅ Correto! Independente da resposta, você sempre ganha a recompensa.'
                      : '❌ Incorreto, mas não se preocupe! Você ainda recebe a recompensa.'
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span className="text-sm">
                  Recompensa garantida: R$ {rewardAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}