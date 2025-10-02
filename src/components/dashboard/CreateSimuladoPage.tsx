import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { 
  Plus, 
  Save, 
  Eye, 
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings,
  Shuffle
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface Question {
  id: string;
  question: string;
  subject: string;
  difficulty: string;
  options: string[];
  correctAnswer: number;
  tags: string[];
}

interface Subject {
  name: string;
  questionsCount: number;
  selected: boolean;
  color: string;
}

export function CreateSimuladoPage({ onBack }: { onBack: () => void }) {
  const [simuladoData, setSimuladoData] = useState({
    title: '',
    description: '',
    grade: '',
    timeLimit: 120,
    questionsPerSubject: 10,
    difficulty: 'Misto',
    shuffleQuestions: true,
    shuffleOptions: true,
    showResults: true,
    allowReview: true
  });

  const [subjects, setSubjects] = useState<Subject[]>([
    { name: 'Matemática', questionsCount: 0, selected: true, color: 'bg-blue-100 text-blue-800' },
    { name: 'Português', questionsCount: 0, selected: true, color: 'bg-green-100 text-green-800' },
    { name: 'História', questionsCount: 0, selected: true, color: 'bg-purple-100 text-purple-800' },
    { name: 'Geografia', questionsCount: 0, selected: true, color: 'bg-yellow-100 text-yellow-800' },
    { name: 'Ciências', questionsCount: 0, selected: true, color: 'bg-red-100 text-red-800' },
    { name: 'Literatura', questionsCount: 0, selected: false, color: 'bg-indigo-100 text-indigo-800' },
    { name: 'Filosofia', questionsCount: 0, selected: false, color: 'bg-pink-100 text-pink-800' },
    { name: 'Sociologia', questionsCount: 0, selected: false, color: 'bg-orange-100 text-orange-800' }
  ]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      console.log('=== Loading questions for simulado creation ===');
      const token = localStorage.getItem('access_token');
      console.log('Auth token present:', !!token);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-83358821/questions`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load questions:', response.status, errorText);
        toast.error('Erro ao carregar questões');
        setQuestions([]);
        return;
      }

      const data = await response.json();
      console.log('Response data:', { 
        success: data.success,
        hasQuestions: !!data.questions,
        questionsLength: data.questions?.length,
        count: data.count
      });
      
      if (!data.questions || !Array.isArray(data.questions)) {
        console.error('Invalid response format - questions is not an array');
        toast.error('Erro no formato dos dados recebidos');
        setQuestions([]);
        return;
      }
      
      const questionsList = data.questions.filter((q: any) => q && q.subject && q.question);
      console.log(`✓ Loaded ${questionsList.length} valid questions for simulado (filtered from ${data.questions.length} total)`);
      setQuestions(questionsList);
      
      // Update subject counts
      const questionsBySubject = questionsList.reduce((acc: any, q: Question) => {
        if (q && q.subject) {
          acc[q.subject] = (acc[q.subject] || 0) + 1;
        }
        return acc;
      }, {});

      setSubjects(prev => prev.map(subject => ({
        ...subject,
        questionsCount: questionsBySubject[subject.name] || 0
      })));
      
      console.log('Subject counts:', questionsBySubject);
      
      if (questionsList.length === 0) {
        console.warn('⚠️ No questions available. Users need to create questions first.');
      }
      
    } catch (error) {
      console.error('Exception loading questions:', error);
      toast.error('Erro ao carregar questões: ' + (error.message || 'Erro desconhecido'));
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectName: string) => {
    setSubjects(prev => prev.map(subject => 
      subject.name === subjectName 
        ? { ...subject, selected: !subject.selected }
        : subject
    ));
  };

  const getSelectedSubjects = () => subjects.filter(s => s.selected);

  const getTotalQuestions = () => {
    return getSelectedSubjects().length * simuladoData.questionsPerSubject;
  };

  const getEstimatedTime = () => {
    const totalQuestions = getTotalQuestions();
    return Math.round(totalQuestions * 1.5); // 1.5 minutos por questão
  };

  const canCreateSimulado = () => {
    const selectedSubjects = getSelectedSubjects();
    return selectedSubjects.every(subject => 
      subject.questionsCount >= simuladoData.questionsPerSubject
    ) && selectedSubjects.length > 0 && simuladoData.title && simuladoData.grade;
  };

  const getSubjectStatus = (subject: Subject) => {
    if (!subject.selected) return 'not-selected';
    if (subject.questionsCount >= simuladoData.questionsPerSubject) return 'ready';
    return 'insufficient';
  };

  const handleCreateSimulado = async () => {
    if (!canCreateSimulado()) {
      toast.error('Verifique os dados do simulado antes de prosseguir');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Selecionar questões aleatórias de cada matéria
      const selectedQuestions: Question[] = [];
      const selectedSubjects = getSelectedSubjects();
      
      for (const subject of selectedSubjects) {
        const subjectQuestions = questions.filter(q => q.subject === subject.name);
        
        // Filtrar por dificuldade se especificado
        let filteredQuestions = subjectQuestions;
        if (simuladoData.difficulty !== 'Misto') {
          filteredQuestions = subjectQuestions.filter(q => q.difficulty === simuladoData.difficulty);
        }
        
        // Embaralhar e selecionar a quantidade necessária
        const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
        selectedQuestions.push(...shuffled.slice(0, simuladoData.questionsPerSubject));
      }

      // Embaralhar questões se solicitado
      if (simuladoData.shuffleQuestions) {
        selectedQuestions.sort(() => Math.random() - 0.5);
      }

      const examData = {
        title: simuladoData.title,
        description: simuladoData.description,
        grade: simuladoData.grade,
        subjects: selectedSubjects.map(s => s.name),
        questions: selectedQuestions.map(q => ({
          ...q,
          options: simuladoData.shuffleOptions 
            ? [...q.options].sort(() => Math.random() - 0.5)
            : q.options
        })),
        timeLimit: simuladoData.timeLimit,
        type: 'simulado',
        settings: {
          questionsPerSubject: simuladoData.questionsPerSubject,
          shuffleQuestions: simuladoData.shuffleQuestions,
          shuffleOptions: simuladoData.shuffleOptions,
          showResults: simuladoData.showResults,
          allowReview: simuladoData.allowReview
        }
      };

      console.log('Creating simulado with data:', {
        title: examData.title,
        subjects: examData.subjects,
        totalQuestions: examData.questions.length,
        timeLimit: examData.timeLimit
      });
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-83358821/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(examData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create simulado:', response.status, errorText);
        throw new Error('Falha ao criar simulado');
      }

      const result = await response.json();
      console.log('Simulado created successfully:', result.exam?.id);
      toast.success('Simulado criado com sucesso!');
      onBack();
    } catch (error) {
      console.error('Error creating simulado:', error);
      toast.error('Erro ao criar simulado: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card className="seice-card">
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Título do Simulado *
            </label>
            <Input
              placeholder="Ex: Simulado Preparatório - 9º Ano"
              value={simuladoData.title}
              onChange={(e) => setSimuladoData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descrição
            </label>
            <Textarea
              placeholder="Descreva o simulado e seus objetivos..."
              value={simuladoData.description}
              onChange={(e) => setSimuladoData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Série/Ano *
              </label>
              <Input
                placeholder="Ex: 9º Ano"
                value={simuladoData.grade}
                onChange={(e) => setSimuladoData(prev => ({ ...prev, grade: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tempo Limite (minutos)
              </label>
              <Input
                type="number"
                value={simuladoData.timeLimit}
                onChange={(e) => setSimuladoData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 120 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card className="seice-card">
        <CardHeader>
          <CardTitle>Seleção de Matérias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Questões por Matéria
              </label>
              <Select 
                value={simuladoData.questionsPerSubject.toString()} 
                onValueChange={(value) => setSimuladoData(prev => ({ 
                  ...prev, 
                  questionsPerSubject: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 questões</SelectItem>
                  <SelectItem value="10">10 questões</SelectItem>
                  <SelectItem value="15">15 questões</SelectItem>
                  <SelectItem value="20">20 questões</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nível de Dificuldade
              </label>
              <Select 
                value={simuladoData.difficulty} 
                onValueChange={(value) => setSimuladoData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Misto">Misto (todas as dificuldades)</SelectItem>
                  <SelectItem value="Fácil">Apenas Fácil</SelectItem>
                  <SelectItem value="Médio">Apenas Médio</SelectItem>
                  <SelectItem value="Difícil">Apenas Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-slate-800 mb-3">Selecione as Matérias:</h4>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map(subject => {
                const status = getSubjectStatus(subject);
                return (
                  <div
                    key={subject.name}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      subject.selected 
                        ? status === 'ready' 
                          ? 'border-green-300 bg-green-50' 
                          : status === 'insufficient'
                          ? 'border-red-300 bg-red-50'
                          : 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => handleSubjectToggle(subject.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox checked={subject.selected} />
                        <div>
                          <p className="font-medium text-slate-800">{subject.name}</p>
                          <p className="text-sm text-slate-600">
                            {subject.questionsCount} questões disponíveis
                          </p>
                        </div>
                      </div>
                      {subject.selected && (
                        <div className="flex items-center">
                          {status === 'ready' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : status === 'insufficient' ? (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="seice-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-blue-600">{getTotalQuestions()}</p>
              <p className="text-sm text-slate-600">Total de Questões</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-green-600">{getSelectedSubjects().length}</p>
              <p className="text-sm text-slate-600">Matérias Selecionadas</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-purple-600">{getEstimatedTime()}</p>
              <p className="text-sm text-slate-600">Tempo Estimado (min)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="seice-card">
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-800">Randomização</h4>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  checked={simuladoData.shuffleQuestions}
                  onCheckedChange={(checked) => 
                    setSimuladoData(prev => ({ ...prev, shuffleQuestions: checked === true }))
                  }
                />
                <div>
                  <p className="font-medium text-slate-700">Embaralhar Questões</p>
                  <p className="text-sm text-slate-500">Ordem aleatória das questões</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  checked={simuladoData.shuffleOptions}
                  onCheckedChange={(checked) => 
                    setSimuladoData(prev => ({ ...prev, shuffleOptions: checked === true }))
                  }
                />
                <div>
                  <p className="font-medium text-slate-700">Embaralhar Alternativas</p>
                  <p className="text-sm text-slate-500">Ordem aleatória das opções</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-slate-800">Resultados</h4>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  checked={simuladoData.showResults}
                  onCheckedChange={(checked) => 
                    setSimuladoData(prev => ({ ...prev, showResults: checked === true }))
                  }
                />
                <div>
                  <p className="font-medium text-slate-700">Mostrar Resultados</p>
                  <p className="text-sm text-slate-500">Exibir nota ao finalizar</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  checked={simuladoData.allowReview}
                  onCheckedChange={(checked) => 
                    setSimuladoData(prev => ({ ...prev, allowReview: checked === true }))
                  }
                />
                <div>
                  <p className="font-medium text-slate-700">Permitir Revisão</p>
                  <p className="text-sm text-slate-500">Revisar questões após finalizar</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Criar Simulado</h1>
            <p className="text-slate-600">Configure um simulado multidisciplinar</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button 
            onClick={handleCreateSimulado}
            disabled={!canCreateSimulado() || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Criando...' : 'Criar Simulado'}
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-6">
        {[1, 2, 3].map(step => (
          <div key={step} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {step}
            </div>
            <span className={`ml-2 text-sm ${
              step <= currentStep ? 'text-slate-800' : 'text-slate-500'
            }`}>
              {step === 1 && 'Informações'}
              {step === 2 && 'Matérias'}
              {step === 3 && 'Configurações'}
            </span>
            {step < 3 && <div className="w-16 h-px bg-slate-200 mx-4" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Anterior
        </Button>
        <Button 
          onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
          disabled={currentStep === 3}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}