import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeVideoTasks } from '@/hooks/useRealtimeVideoTasks';

interface VideoQuestion {
  id: string;
  video_task_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  correct_option: 'a' | 'b';
  created_at: string;
}

export const VideoQuestionsManagement = () => {
  const { tasks } = useRealtimeVideoTasks();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<VideoQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<VideoQuestion | null>(null);
  
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    correct_option: 'a' as 'a' | 'b'
  });

  useEffect(() => {
    if (selectedVideoId) {
      fetchQuestions();
    }
  }, [selectedVideoId]);

  const fetchQuestions = async () => {
    if (!selectedVideoId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_questions')
        .select('*')
        .eq('video_task_id', selectedVideoId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQuestions((data || []) as VideoQuestion[]);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar perguntas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoId) return;

    setLoading(true);
    try {
      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('video_questions')
          .update({
            question_text: formData.question_text,
            option_a: formData.option_a,
            option_b: formData.option_b,
            correct_option: formData.correct_option,
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Pergunta atualizada com sucesso!",
        });
      } else {
        // Create new question
        const { error } = await supabase
          .from('video_questions')
          .insert({
            video_task_id: selectedVideoId,
            question_text: formData.question_text,
            option_a: formData.option_a,
            option_b: formData.option_b,
            correct_option: formData.correct_option,
          });

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Pergunta criada com sucesso!",
        });
      }

      setFormData({
        question_text: '',
        option_a: '',
        option_b: '',
        correct_option: 'a'
      });
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar pergunta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;

    try {
      const { error } = await supabase
        .from('video_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Pergunta excluída com sucesso!",
      });
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir pergunta",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (question: VideoQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      correct_option: question.correct_option
    });
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setFormData({
      question_text: '',
      option_a: '',
      option_b: '',
      correct_option: 'a'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Perguntas dos Vídeos</h2>
      </div>

      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manage">Gerenciar Perguntas</TabsTrigger>
          <TabsTrigger value="create">Criar/Editar Pergunta</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Vídeo</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vídeo" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title} - VIP {task.vip_level_required}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedVideoId && (
            <Card>
              <CardHeader>
                <CardTitle>Perguntas do Vídeo ({questions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Carregando...</p>
                ) : questions.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma pergunta encontrada para este vídeo.</p>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <div key={question.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">{question.question_text}</h4>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className={question.correct_option === 'a' ? 'text-green-600 font-medium' : ''}>
                            A) {question.option_a} {question.correct_option === 'a' && '✓'}
                          </p>
                          <p className={question.correct_option === 'b' ? 'text-green-600 font-medium' : ''}>
                            B) {question.option_b} {question.correct_option === 'b' && '✓'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingQuestion ? 'Editar Pergunta' : 'Criar Nova Pergunta'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="video">Vídeo</Label>
                  <Select 
                    value={selectedVideoId} 
                    onValueChange={setSelectedVideoId}
                    disabled={editingQuestion !== null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um vídeo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title} - VIP {task.vip_level_required}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="question_text">Pergunta</Label>
                  <Textarea
                    id="question_text"
                    value={formData.question_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                    placeholder="Digite a pergunta sobre o vídeo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="option_a">Opção A</Label>
                  <Input
                    id="option_a"
                    value={formData.option_a}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_a: e.target.value }))}
                    placeholder="Primeira opção de resposta"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="option_b">Opção B</Label>
                  <Input
                    id="option_b"
                    value={formData.option_b}
                    onChange={(e) => setFormData(prev => ({ ...prev, option_b: e.target.value }))}
                    placeholder="Segunda opção de resposta"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="correct_option">Resposta Correta</Label>
                  <Select 
                    value={formData.correct_option} 
                    onValueChange={(value: 'a' | 'b') => setFormData(prev => ({ ...prev, correct_option: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">Opção A</SelectItem>
                      <SelectItem value="b">Opção B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading || !selectedVideoId}>
                    {editingQuestion ? 'Atualizar' : 'Criar'} Pergunta
                  </Button>
                  {editingQuestion && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};