import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle } from 'lucide-react';
import { useVideoQuestions } from '@/hooks/useVideoQuestions';

interface VideoQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  videoTaskId: string;
  onAllAnswered: () => void;
}

export const VideoQuestionDialog = ({ 
  open, 
  onClose, 
  videoTaskId, 
  onAllAnswered 
}: VideoQuestionDialogProps) => {
  const { questions, submitAnswer, hasAnsweredQuestion, hasAnsweredAllQuestions } = useVideoQuestions(videoTaskId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'a' | 'b' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = async (option: 'a' | 'b') => {
    if (!currentQuestion || hasAnsweredQuestion(currentQuestion.id)) return;

    setSelectedAnswer(option);
    const result = await submitAnswer(currentQuestion.id, option);
    
    if (result) {
      setAnswerResult(result.isCorrect);
      setShowResult(true);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswerResult(null);
    } else {
      // All questions answered
      onAllAnswered();
      onClose();
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Pergunta {currentQuestionIndex + 1} de {questions.length}
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQuestion.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showResult ? (
              <>
                <Button
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-4"
                  onClick={() => handleAnswerSelect('a')}
                  disabled={selectedAnswer !== null}
                >
                  A) {currentQuestion.option_a}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-4"
                  onClick={() => handleAnswerSelect('b')}
                  disabled={selectedAnswer !== null}
                >
                  B) {currentQuestion.option_b}
                </Button>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  {answerResult ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <span className="text-xl font-semibold text-green-500">✅ Correto!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-red-500" />
                      <span className="text-xl font-semibold text-red-500">❌ Errado!</span>
                    </>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Resposta correta: {currentQuestion.correct_option.toUpperCase()}) {
                    currentQuestion.correct_option === 'a' 
                      ? currentQuestion.option_a 
                      : currentQuestion.option_b
                  }
                </div>

                <Button onClick={handleNext} className="w-full">
                  {currentQuestionIndex < questions.length - 1 ? 'Próxima Pergunta' : 'Finalizar'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};