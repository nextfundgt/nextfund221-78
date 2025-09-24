import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, User, Shield, Settings, Trash2, Download, HelpCircle, MessageSquare, LogOut, Upload, Camera } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useTheme } from 'next-themes';

const Profile = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const { preferences, loading: prefsLoading, updatePreference } = useUserPreferences();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para os formulários
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Inicializar dados
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  // Sync theme with preferences
  useEffect(() => {
    if (preferences && theme !== (preferences.dark_theme ? 'dark' : 'light')) {
      setTheme(preferences.dark_theme ? 'dark' : 'light');
    }
  }, [preferences?.dark_theme, theme, setTheme]);

  // Atualizar perfil
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', profile.user_id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o perfil. Tente novamente.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!'
      });
    } catch (error) {
      console.error('Error in handleProfileUpdate:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      });
    }
  };

  // Alterar senha
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível alterar a senha. Tente novamente.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Senha alterada com sucesso!'
      });
      
      // Limpar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error in handlePasswordChange:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      });
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Sucesso',
        description: 'Logout realizado com sucesso!'
      });
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout.',
        variant: 'destructive'
      });
    }
  };

  // Deletar conta (placeholder)
  const handleDeleteAccount = () => {
    toast({
      title: 'Recurso em Desenvolvimento',
      description: 'A funcionalidade de deletar conta será implementada em breve.',
      variant: 'destructive'
    });
  };

  // Exportar dados
  const exportData = () => {
    const data = {
      profile: profile,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Sucesso',
      description: 'Dados exportados com sucesso!'
    });
  };

  // Upload avatar function
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.user_id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ 
        title: 'Erro',
        description: 'Por favor, selecione apenas arquivos de imagem.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploadingAvatar(true);

      // Create file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', profile.user_id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Sucesso',
        description: 'Foto de perfil atualizada com sucesso!',
      });

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload da foto. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Função para gerar iniciais
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DashboardLayout title="Configurações do Perfil">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Configurações do Perfil</h1>
        </div>

        {/* Visão geral do perfil */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{profile?.full_name || 'Usuário'}</h2>
                <p className="text-muted-foreground">{profile?.user_id}</p>
                <Badge variant="secondary">Usuário Verificado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Pessoal
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferências
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Conta
            </TabsTrigger>
          </TabsList>

          {/* Aba Pessoal */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais aqui.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile?.user_id || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-id">ID do Usuário</Label>
                    <Input
                      id="user-id"
                      type="text"
                      value={profile?.user_id || ''}
                      disabled
                      className="bg-muted font-mono text-sm"
                    />
                  </div>
                  <Button type="submit">
                    Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Segurança */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alterar Senha</CardTitle>
                  <CardDescription>
                    Atualize sua senha para manter sua conta segura.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {newPassword && (
                        <div className="mt-2">
                          <div className="text-sm text-muted-foreground mb-1">Força da senha:</div>
                          <Progress 
                            value={
                              newPassword.length < 6 ? 25 :
                              newPassword.length < 8 ? 50 :
                              /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword) ? 100 : 75
                            } 
                            className="h-2"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {newPassword.length < 6 && "Muito fraca"}
                            {newPassword.length >= 6 && newPassword.length < 8 && "Fraca"}
                            {newPassword.length >= 8 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword) && "Média"}
                            {/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword) && "Forte"}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit">
                      Alterar Senha
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Segurança</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Autenticação de dois fatores</Label>
                      <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                    </div>
                    <Switch disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações de login</Label>
                      <p className="text-sm text-muted-foreground">Receba alertas sobre novos logins</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Preferências */}
          <TabsContent value="preferences">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notificações</CardTitle>
                  <CardDescription>
                    Configure como você deseja receber notificações.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Canais de Notificação</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email-notifications">Notificações por email</Label>
                          <Switch
                            id="email-notifications"
                            checked={preferences?.notifications_email ?? true}
                            onCheckedChange={(checked) => updatePreference('notifications_email', checked)}
                            disabled={prefsLoading}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="push-notifications">Notificações push</Label>
                          <Switch
                            id="push-notifications"
                            checked={preferences?.notifications_push ?? true}
                            onCheckedChange={(checked) => updatePreference('notifications_push', checked)}
                            disabled={prefsLoading}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sms-notifications">Notificações por SMS</Label>
                          <Switch
                            id="sms-notifications"
                            checked={preferences?.notifications_sms ?? false}
                            onCheckedChange={(checked) => updatePreference('notifications_sms', checked)}
                            disabled={prefsLoading}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="marketing-notifications">Notificações de marketing</Label>
                          <Switch
                            id="marketing-notifications"
                            checked={preferences?.notifications_marketing ?? false}
                            onCheckedChange={(checked) => updatePreference('notifications_marketing', checked)}
                            disabled={prefsLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-3">Privacidade</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-balance">Mostrar saldo</Label>
                          <Switch
                            id="show-balance"
                            checked={preferences?.show_balance ?? true}
                            onCheckedChange={(checked) => updatePreference('show_balance', checked)}
                            disabled={prefsLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-3">Aparência</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="dark-mode">Tema escuro</Label>
                          <Switch
                            id="dark-mode"
                            checked={preferences?.dark_theme ?? false}
                            onCheckedChange={(checked) => {
                              updatePreference('dark_theme', checked);
                              setTheme(checked ? 'dark' : 'light');
                            }}
                            disabled={prefsLoading}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="animations">Animações</Label>
                          <Switch
                            id="animations"
                            checked={preferences?.animations_enabled ?? true}
                            onCheckedChange={(checked) => updatePreference('animations_enabled', checked)}
                            disabled={prefsLoading}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sounds">Sons</Label>
                          <Switch
                            id="sounds"
                            checked={preferences?.sounds_enabled ?? true}
                            onCheckedChange={(checked) => updatePreference('sounds_enabled', checked)}
                            disabled={prefsLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Conta */}
          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento da Conta</CardTitle>
                  <CardDescription>
                    Gerencie seus dados e configurações da conta.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium">Exportar Dados</h4>
                      <p className="text-sm text-muted-foreground">Baixe uma cópia dos seus dados</p>
                    </div>
                    <Button variant="outline" onClick={exportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium">Central de Ajuda</h4>
                      <p className="text-sm text-muted-foreground">Acesse nossa documentação e tutoriais</p>
                    </div>
                    <Button variant="outline">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Ajuda
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium">Contatar Suporte</h4>
                      <p className="text-sm text-muted-foreground">Precisa de ajuda? Entre em contato conosco</p>
                    </div>
                    <Button variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Suporte
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium">Sair da Conta</h4>
                      <p className="text-sm text-muted-foreground">Fazer logout de todos os dispositivos</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                  <CardDescription>
                    Ações irreversíveis que afetam permanentemente sua conta.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar Conta
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso irá deletar permanentemente sua conta
                          e remover todos os seus dados de nossos servidores.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                          Sim, deletar conta
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;