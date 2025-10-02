import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  Eye,
  Download,
  Camera
} from 'lucide-react';
import { apiService } from '../../utils/api';
import { toast } from 'sonner@2.0.3';

export function SendImagesPage() {
  const [selectedExam, setSelectedExam] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [examsResponse, imagesResponse] = await Promise.all([
        apiService.getExams(),
        apiService.getImages()
      ]);
      
      setExams(examsResponse.exams || []);
      setImages(imagesResponse.images || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!selectedExam) {
      toast.error('Selecione uma avaliação primeiro');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((i / files.length) * 100);

        // Convert file to base64 for storage
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64Data = e.target?.result as string;
            
            const imageData = {
              filename: file.name,
              examId: selectedExam,
              examTitle: exams.find(e => e.id === selectedExam)?.title || 'Não selecionada',
              size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
              mimeType: file.type,
              data: base64Data,
              pages: 1 // Will be determined by processing
            };

            await apiService.uploadImage(imageData);
          } catch (error) {
            console.error('Error uploading file:', error);
            toast.error(`Erro ao enviar ${file.name}`);
          }
        };
        reader.readAsDataURL(file);
      }

      setUploadProgress(100);
      setTimeout(async () => {
        setIsUploading(false);
        setUploadProgress(0);
        await loadData();
        toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
      }, 1000);

    } catch (error) {
      console.error('Error in file upload:', error);
      toast.error('Erro durante o upload');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processada': return 'bg-green-100 text-green-800';
      case 'Processando': return 'bg-yellow-100 text-yellow-800';
      case 'Erro': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Processada': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Processando': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Erro': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const allImages = images;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Enviar Imagens</h1>
        <p className="text-slate-600">Faça upload das provas escaneadas para correção automática</p>
      </div>

      {/* Upload Section */}
      <Card className="seice-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload de Imagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Selecione a Avaliação
            </label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha a avaliação..." />
              </SelectTrigger>
              <SelectContent>
                {exams.map(exam => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div>
                <p className="text-lg font-medium text-slate-800 mb-2">
                  Arraste e solte suas imagens aqui
                </p>
                <p className="text-slate-500 mb-4">
                  ou clique para selecionar arquivos
                </p>
                <p className="text-xs text-slate-400">
                  Formatos aceitos: JPG, PNG, PDF • Tamanho máximo: 10MB por arquivo
                </p>
              </div>

              <div>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={!selectedExam}
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center px-4 py-2 rounded-lg font-medium cursor-pointer ${
                    selectedExam 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Arquivos
                </label>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-slate-600">
                    Enviando... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              Dicas para melhor qualidade:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use boa iluminação, evite sombras</li>
              <li>• Mantenha a prova completamente visível</li>
              <li>• Evite reflexos e borrões</li>
              <li>• Escaneie em resolução mínima de 300 DPI</li>
              <li>• Certifique-se que o texto está legível</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="seice-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Imagens</p>
                <p className="text-2xl font-semibold text-slate-800">{allImages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="seice-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Processadas</p>
                <p className="text-2xl font-semibold text-slate-800">
                  {allImages.filter(img => img.status === 'Processada').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="seice-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Processando</p>
                <p className="text-2xl font-semibold text-slate-800">
                  {allImages.filter(img => img.status === 'Processando').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="seice-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Com Erro</p>
                <p className="text-2xl font-semibold text-slate-800">
                  {allImages.filter(img => img.status === 'Erro').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Images List */}
      <Card className="seice-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Imagens Enviadas ({allImages.length})
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar Lista
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allImages.map(image => (
              <div key={image.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-slate-800">{image.filename}</p>
                      <Badge className={getStatusColor(image.status)}>
                        {image.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{image.examTitle}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                      <span>Aluno: {image.studentName}</span>
                      <span>Tamanho: {image.size}</span>
                      <span>Páginas: {image.pages}</span>
                      <span>Enviado: {image.uploadedAt}</span>
                    </div>
                    {image.error && (
                      <p className="text-xs text-red-600 mt-1">Erro: {image.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {getStatusIcon(image.status)}
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {allImages.length === 0 && (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-medium text-slate-800 mb-2">Nenhuma imagem enviada</h3>
              <p className="text-slate-500">Comece selecionando uma avaliação e enviando as imagens das provas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}