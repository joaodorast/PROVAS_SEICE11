import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  Users, 
  Download, 
  Plus, 
  Trash2,
  Edit,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiService } from '../../utils/api';

type Student = {
  id: string;
  name: string;
  email: string;
  class: string;
  grade: string;
  registration: string;
  status: 'active' | 'inactive';
  createdAt: string;
};

export function ImportStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    class: '',
    grade: '',
    registration: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStudents();
      setStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Erro ao carregar lista de alunos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvData = e.target?.result as string;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        if (headers.length < 4) {
          toast.error('Arquivo CSV deve conter pelo menos: Nome, Email, Turma, Turno');
          return;
        }

        const newStudents: Omit<Student, 'id' | 'status' | 'createdAt'>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',');
          if (data.length >= 4 && data[0].trim()) {
            newStudents.push({
              name: data[0].trim(),
              email: data[1].trim(),
              class: data[2].trim(),
              grade: data[3].trim(),
              registration: data[4]?.trim() || '1° ANO'
            });
          }
        }

        if (newStudents.length > 0) {
          apiService.createStudents(newStudents).then(() => {
            return loadStudents();
          }).then(() => {
            toast.success(`${newStudents.length} alunos importados com sucesso!`);
          }).catch(() => {
            toast.error('Erro ao salvar alunos no servidor');
          });
        }
      } catch (error) {
        toast.error('Erro ao processar arquivo CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      await apiService.createStudents([newStudent]);
      await loadStudents();
      setNewStudent({ name: '', email: '', class: '', grade: '', registration: '' });
      setShowAddForm(false);
      toast.success('Aluno adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Erro ao adicionar aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      setLoading(true);
      await apiService.deleteStudent(id);
      await loadStudents();
      toast.success('Aluno removido com sucesso!');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Erro ao remover aluno');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      'Nome,Email,Turma,Turno,Matrícula,Status',
      ...students.map(s => `${s.name},${s.email},${s.class},${s.grade},${s.registration},${s.status}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alunos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || student.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Importar Alunos</h1>
          <p className="text-slate-600">
            Gerencie a lista de alunos do sistema
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Aluno
          </Button>
        </div>
      </div>

      {/* Import Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="seice-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Importar CSV
            </CardTitle>
            <CardDescription>
              Importe uma lista de alunos usando um arquivo CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="csvFile">Arquivo CSV</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  O arquivo deve conter as colunas: Nome, Email, Turma, Turno, Matrícula
                </p>
              </div>
              <Button variant="outline" className="w-full">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Baixar Modelo CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="seice-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total de Alunos:</span>
                <Badge variant="secondary">{students.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Alunos Ativos:</span>
                <Badge variant="default">
                  {students.filter(s => s.status === 'active').length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Turmas:</span>
                <Badge variant="outline">{uniqueClasses.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <Card className="seice-card">
          <CardHeader>
            <CardTitle>Adicionar Novo Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do aluno"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="class">Turma</Label>
                <Input
                  id="class"
                  value={newStudent.class}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, class: e.target.value }))}
                  placeholder="Turma A"
                />
              </div>
              <div>
                <Label htmlFor="grade">Turno</Label>
                <Select value={newStudent.grade} onValueChange={(value) => setNewStudent(prev => ({ ...prev, grade: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matutino">Matutino</SelectItem>
                    <SelectItem value="Vespertino">Vespertino</SelectItem>
                    <SelectItem value="Noturno">Noturno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="registration">Matrícula</Label>
                <Select value={newStudent.registration} onValueChange={(value) => setNewStudent(prev => ({ ...prev, registration: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a série" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1° ANO">1° ANO</SelectItem>
                    <SelectItem value="2° ANO">2° ANO</SelectItem>
                    <SelectItem value="3° ANO">3° ANO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <Button onClick={handleAddStudent}>
                Adicionar Aluno
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="seice-card">
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {uniqueClasses.map(className => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.registration}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterClass !== 'all' 
                  ? 'Nenhum aluno encontrado com os filtros aplicados'
                  : 'Nenhum aluno cadastrado ainda'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}