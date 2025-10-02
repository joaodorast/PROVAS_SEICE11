import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  Settings, 
  User as UserIcon, 
  Bell, 
  Shield, 
  Database, 
  Mail,
  Palette,
  Globe,
  Clock,
  BookOpen,
  Users,
  FileText,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  Check
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { User, Exam, Submission } from '../../App';

type ConfigurationPageProps = {
  user: User;
  exams: Exam[];
  submissions: Submission[];
  onRefresh: () => void;
  onStartExam: (exam: Exam) => void;
  onViewResults: (submission: Submission) => void;
  onCreateExam: () => void;
};

export function ConfigurationPage({ user }: ConfigurationPageProps) {
  // User Profile Settings
  const [profileData, setProfileData] = useState({
    name: user.user_metadata.name || '',
    email: user.email || '',
    institution: 'SEICE - Sistema de Ensino',
    position: 'Professor',
    bio: 'Educador especializado em avaliações e ensino.',
    phone: '',
    address: ''
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    defaultTimeLimit: 60,
    allowReviewAnswers: true,
    shuffleQuestions: false,
    showCorrectAnswers: true,
    requireRegistration: true,
    enableNotifications: true,
    autoSaveInterval: 30,
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo'
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailOnSubmission: true,
    emailOnNewStudent: false,
    emailWeeklyReport: true,
    pushNotifications: true,
    smsNotifications: false
  });

  // Security Settings
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: 120,
    passwordExpiry: 90,
    loginAttempts: 5
  });

  const handleSaveProfile = () => {
    toast.success('Perfil atualizado com sucesso!');
  };

  const handleSaveSystemSettings = () => {
    toast.success('Configurações do sistema salvas!');
  };

  const handleSaveNotifications = () => {
    toast.success('Configurações de notificação atualizadas!');
  };

  const handleSaveSecurity = () => {
    toast.success('Configurações de segurança atualizadas!');
  };

  const handleExportData = () => {
    toast.success('Dados exportados com sucesso!');
  };

  const handleImportData = () => {
    toast.success('Dados importados com sucesso!');
  };

  const handleResetSettings = () => {
    if (window.confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      toast.success('Configurações restauradas para o padrão!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <UserIcon className="w-4 h-4" />
            <span>Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Dados</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e profissionais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Instituição</Label>
                  <Input
                    id="institution"
                    value={profileData.institution}
                    onChange={(e) => setProfileData(prev => ({ ...prev, institution: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={profileData.position}
                    onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(21) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
              <Button onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Perfil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Configurações de Prova
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTimeLimit">Tempo Limite Padrão (minutos)</Label>
                  <Input
                    id="defaultTimeLimit"
                    type="number"
                    value={systemSettings.defaultTimeLimit}
                    onChange={(e) => setSystemSettings(prev => ({ 
                      ...prev, defaultTimeLimit: parseInt(e.target.value) || 60 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="autoSaveInterval">Intervalo de Auto-salvamento (segundos)</Label>
                  <Input
                    id="autoSaveInterval"
                    type="number"
                    value={systemSettings.autoSaveInterval}
                    onChange={(e) => setSystemSettings(prev => ({ 
                      ...prev, autoSaveInterval: parseInt(e.target.value) || 30 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir revisão de respostas</Label>
                    <p className="text-sm text-muted-foreground">
                      Alunos podem revisar suas respostas antes de finalizar
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.allowReviewAnswers}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                      ...prev, allowReviewAnswers: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Embaralhar questões</Label>
                    <p className="text-sm text-muted-foreground">
                      Ordem das questões será aleatória para cada aluno
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.shuffleQuestions}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                      ...prev, shuffleQuestions: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar respostas corretas</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir gabarito após finalizar a prova
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.showCorrectAnswers}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                      ...prev, showCorrectAnswers: checked 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select value={systemSettings.language} onValueChange={(value) => 
                    setSystemSettings(prev => ({ ...prev, language: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={systemSettings.timezone} onValueChange={(value) => 
                    setSystemSettings(prev => ({ ...prev, timezone: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Exigir cadastro</Label>
                    <p className="text-sm text-muted-foreground">
                      Alunos devem se cadastrar para fazer provas
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.requireRegistration}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                      ...prev, requireRegistration: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Habilitar notificações</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações do sistema
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.enableNotifications}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                      ...prev, enableNotifications: checked 
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveSystemSettings}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Preferências de Notificação
              </CardTitle>
              <CardDescription>
                Configure como e quando você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email ao receber submissão</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber email quando um aluno finalizar uma prova
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOnSubmission}
                    onCheckedChange={(checked) => setNotifications(prev => ({ 
                      ...prev, emailOnSubmission: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email para novos alunos</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber email quando um novo aluno se cadastrar
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailOnNewStudent}
                    onCheckedChange={(checked) => setNotifications(prev => ({ 
                      ...prev, emailOnNewStudent: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatório semanal por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber resumo semanal de atividades por email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailWeeklyReport}
                    onCheckedChange={(checked) => setNotifications(prev => ({ 
                      ...prev, emailWeeklyReport: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações push no navegador
                    </p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ 
                      ...prev, pushNotifications: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações importantes via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ 
                      ...prev, smsNotifications: checked 
                    }))}
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Notificações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Configure as opções de segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação de dois fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicionar camada extra de segurança com 2FA
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={security.twoFactorAuth}
                      onCheckedChange={(checked) => setSecurity(prev => ({ 
                        ...prev, twoFactorAuth: checked 
                      }))}
                    />
                    {security.twoFactorAuth && <Badge variant="default">Ativo</Badge>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout da sessão (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity(prev => ({ 
                      ...prev, sessionTimeout: parseInt(e.target.value) || 120 
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Tempo antes da sessão expirar automaticamente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordExpiry">Expiração da senha (dias)</Label>
                  <Input
                    id="passwordExpiry"
                    type="number"
                    value={security.passwordExpiry}
                    onChange={(e) => setSecurity(prev => ({ 
                      ...prev, passwordExpiry: parseInt(e.target.value) || 90 
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Quantos dias até ser necessário trocar a senha
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginAttempts">Tentativas de login</Label>
                  <Input
                    id="loginAttempts"
                    type="number"
                    value={security.loginAttempts}
                    onChange={(e) => setSecurity(prev => ({ 
                      ...prev, loginAttempts: parseInt(e.target.value) || 5 
                    }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Número máximo de tentativas antes de bloquear
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSaveSecurity}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Segurança
                </Button>
                <Button variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management */}
        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Importar Dados
                </CardTitle>
                <CardDescription>
                  Importe dados de outros sistemas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={handleImportData}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Alunos (CSV)
                </Button>
                <Button className="w-full" variant="outline" onClick={handleImportData}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Questões (JSON)
                </Button>
                <Button className="w-full" variant="outline" onClick={handleImportData}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Configurações
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  Exportar Dados
                </CardTitle>
                <CardDescription>
                  Exporte seus dados para backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Todos os Dados
                </Button>
                <Button className="w-full" variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Apenas Resultados
                </Button>
                <Button className="w-full" variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Configurações
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis - use com cuidado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">Excluir Todos os Dados</h4>
                <p className="text-sm text-red-600 mb-4">
                  Esta ação excluirá permanentemente todas as provas, submissões e dados do usuário.
                  Esta ação não pode ser desfeita.
                </p>
                <Button variant="destructive" size="sm">
                  Excluir Todos os Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}