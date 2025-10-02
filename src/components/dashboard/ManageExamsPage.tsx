import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  Calendar,
  Clock,
  Users,
  Target,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { User, Exam, Submission } from '../../App';

type ManageExamsPageProps = {
  user: User;
  exams: Exam[];
  submissions: Submission[];
  onRefresh: () => void;
  onStartExam: (exam: Exam) => void;
  onViewResults: (submission: Submission) => void;
  onCreateExam: () => void;
};

export function ManageExamsPage({ user, exams, submissions, onRefresh, onStartExam, onCreateExam }: ManageExamsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getExamSubmissions = (examId: string) => {
    return submissions.filter(sub => sub.examId === examId);
  };

  const getExamStats = (examId: string) => {
    const examSubmissions = getExamSubmissions(examId);
    const avgScore = examSubmissions.length > 0 
      ? Math.round(examSubmissions.reduce((sum, sub) => sum + sub.percentage, 0) / examSubmissions.length)
      : 0;
    return {
      submissions: examSubmissions.length,
      avgScore
    };
  };

  const handleDuplicateExam = (exam: Exam) => {
    // Create a copy of the exam
    const duplicatedExam = {
      ...exam,
      id: crypto.randomUUID(),
      title: `${exam.title} (Cópia)`,
      createdAt: new Date().toISOString()
    };
    
    toast.success('Prova duplicada com sucesso!');
    onRefresh();
  };

  const handleDeleteExam = (examId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta prova?')) {
      toast.success('Prova excluída com sucesso!');
      onRefresh();
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || exam.subject === filterSubject;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && exam.isActive) ||
                         (filterStatus === 'inactive' && !exam.isActive);
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const uniqueSubjects = Array.from(new Set(exams.map(e => e.subject))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banco de Questões</h1>
          <p className="text-muted-foreground">
            Gerencie suas avaliações e banco de questões
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar Questões
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={onCreateExam}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Avaliação
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Provas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">
              Avaliações criadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questões</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exams.reduce((total, exam) => total + exam.questions.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de questões
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provas Ativas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exams.filter(e => e.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para aplicação
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matérias</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSubjects.length}</div>
            <p className="text-xs text-muted-foreground">
              Diferentes matérias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Avaliações</CardTitle>
          <CardDescription>
            Gerencie e organize suas provas e questões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por matéria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as matérias</SelectItem>
                {uniqueSubjects.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Matéria</TableHead>
                  <TableHead>Questões</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aplicações</TableHead>
                  <TableHead>Média</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => {
                  const stats = getExamStats(exam.id);
                  return (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{exam.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {exam.description || 'Sem descrição'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {exam.subject || 'Geral'}
                        </Badge>
                      </TableCell>
                      <TableCell>{exam.questions.length}</TableCell>
                      <TableCell>{exam.timeLimit}min</TableCell>
                      <TableCell>
                        <Badge variant={exam.isActive ? 'default' : 'secondary'}>
                          {exam.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>{stats.submissions}</TableCell>
                      <TableCell>
                        {stats.submissions > 0 ? `${stats.avgScore}%` : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(exam.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button variant="outline" size="sm" title="Visualizar">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Duplicar"
                            onClick={() => handleDuplicateExam(exam)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Fazer Simulado"
                            onClick={() => onStartExam(exam)}
                          >
                            <Target className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Excluir"
                            onClick={() => handleDeleteExam(exam.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredExams.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterSubject !== 'all' || filterStatus !== 'all'
                  ? 'Nenhuma prova encontrada'
                  : 'Nenhuma prova criada ainda'
                }
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterSubject !== 'all' || filterStatus !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira avaliação'
                }
              </p>
              {!searchTerm && filterSubject === 'all' && filterStatus === 'all' && (
                <Button onClick={onCreateExam}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Prova
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onCreateExam}>
          <CardContent className="p-6 text-center">
            <Plus className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Criar Nova Avaliação</h3>
            <p className="text-sm text-gray-600">
              Monte uma nova prova com questões personalizadas
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Upload className="w-12 h-12 mx-auto text-green-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Importar Questões</h3>
            <p className="text-sm text-gray-600">
              Importe questões de um arquivo ou banco de dados
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-purple-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Banco de Questões</h3>
            <p className="text-sm text-gray-600">
              Organize e gerencie seu banco de questões
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}