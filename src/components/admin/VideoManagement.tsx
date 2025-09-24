import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Video, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { useVideoTasks } from '@/hooks/useVideoTasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function VideoManagement() {
  const { tasks, loading, refetch } = useVideoTasks();
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    reward_amount: '12',
    vip_level_required: '0',
    is_premium: false,
    duration_seconds: '30'
  });

  const handleVideoUpload = async (file: File) => {
    try {
      setUploadingVideo(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      toast.error('Erro ao fazer upload do vídeo');
      throw error;
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      setUploadingThumbnail(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `thumb-${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      toast.error('Erro ao fazer upload da miniatura');
      throw error;
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const videoFile = videoFileRef.current?.files?.[0];
      const thumbnailFile = thumbnailFileRef.current?.files?.[0];
      
      if (!videoFile) {
        toast.error('Selecione um arquivo de vídeo');
        return;
      }

      const videoUrl = await handleVideoUpload(videoFile);
      let thumbnailUrl = '';
      
      if (thumbnailFile) {
        thumbnailUrl = await handleThumbnailUpload(thumbnailFile);
      }

      const { error } = await supabase
        .from('video_tasks')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            category: formData.category,
            reward_amount: parseFloat(formData.reward_amount),
            vip_level_required: parseInt(formData.vip_level_required),
            is_premium: formData.is_premium,
            duration_seconds: parseInt(formData.duration_seconds),
            status: 'active',
            created_by_admin: true
          }
        ]);

      if (error) throw error;

      toast.success('Vídeo cadastrado com sucesso!');
      setFormData({
        title: '',
        description: '',
        category: 'general',
        reward_amount: '12',
        vip_level_required: '0',
        is_premium: false,
        duration_seconds: '30'
      });
      
      if (videoFileRef.current) videoFileRef.current.value = '';
      if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';
      
      refetch();
    } catch (error) {
      toast.error('Erro ao cadastrar vídeo');
    }
  };

  const toggleVideoStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('video_tasks')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Vídeo ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
      refetch();
    } catch (error) {
      toast.error('Erro ao alterar status do vídeo');
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return;
    
    try {
      const { error } = await supabase
        .from('video_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Vídeo excluído com sucesso!');
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir vídeo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Adicionar Novo Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Título</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do vídeo"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="finance">Finanças</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="education">Educação</SelectItem>
                    <SelectItem value="news">Notícias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do vídeo"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Recompensa (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.reward_amount}
                  onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })}
                  placeholder="12.00"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Duração (seg)</label>
                <Input
                  type="number"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                  placeholder="30"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Nível VIP Necessário</label>
                <Select value={formData.vip_level_required} onValueChange={(value) => setFormData({ ...formData, vip_level_required: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Gratuito</SelectItem>
                    <SelectItem value="1">VIP 1</SelectItem>
                    <SelectItem value="2">VIP 2</SelectItem>
                    <SelectItem value="3">VIP 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="premium"
                  checked={formData.is_premium}
                  onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="premium" className="text-sm font-medium">Premium</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Arquivo de Vídeo</label>
                <Input
                  ref={videoFileRef}
                  type="file"
                  accept="video/*"
                  required
                  disabled={uploadingVideo}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Miniatura (opcional)</label>
                <Input
                  ref={thumbnailFileRef}
                  type="file"
                  accept="image/*"
                  disabled={uploadingThumbnail}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={uploadingVideo || uploadingThumbnail}
              className="w-full"
            >
              {uploadingVideo || uploadingThumbnail ? 'Fazendo Upload...' : 'Cadastrar Vídeo'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Videos List */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Vídeos Cadastrados ({tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{task.title}</h3>
                    <Badge variant={task.status === 'active' ? 'default' : 'secondary'}>
                      {task.status}
                    </Badge>
                    <Badge variant={task.is_premium ? "default" : "secondary"}>
                      {task.vip_level_required && task.vip_level_required > 0 ? `VIP ${task.vip_level_required}` : task.is_premium ? 'Premium' : 'Gratuito'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{task.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>R$ {task.reward_amount}</span>
                    <span>{task.duration_seconds}s</span>
                    <span>{task.category}</span>
                    <span>{task.view_count || 0} visualizações</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleVideoStatus(task.id, task.status)}
                  >
                    {task.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteVideo(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum vídeo cadastrado ainda.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}