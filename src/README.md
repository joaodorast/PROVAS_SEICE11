# Sistema SEICE - Provas e Avaliações

Um sistema completo de simulados e provas educacionais construído com React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades

### Dashboard Principal
- **Página de Visão Geral**: Estatísticas, ações rápidas e dados dos alunos
- **Navegação Sidebar**: Interface moderna inspirada no design SEICE
- **Sistema de Autenticação**: Login e cadastro via Supabase Auth

### Gestão de Alunos
- **Importar Alunos**: Upload de CSV com validação
- **Cadastro Manual**: Formulário para adicionar alunos individualmente
- **Gestão de Turmas**: Organização por turmas e turnos
- **Exportação de Dados**: Download da lista de alunos em CSV

### Banco de Questões
- **Criação de Provas**: Editor completo com questões múltipla escolha
- **Organização por Matérias**: Classificação e filtros por disciplina
- **Duplicação de Provas**: Reutilização de conteúdo
- **Importação/Exportação**: Backup e compartilhamento de questões

### Aplicação de Provas
- **Múltiplos Métodos**: Online, impresso ou híbrido
- **Configurações Avançadas**: Timer, embaralhamento, revisão
- **Seleção de Alunos**: Aplicação direcionada
- **Links e QR Codes**: Acesso facilitado para alunos

### Correção Automática
- **Correção Instantânea**: Resultados em tempo real
- **Analytics de Performance**: Estatísticas detalhadas
- **Exportação de Resultados**: Relatórios em PDF/CSV
- **Feedback Detalhado**: Explicações por questão

### Relatórios e Dashboard
- **Gráficos Interativos**: Visualização de dados com Recharts
- **Análise Temporal**: Evolução da performance
- **Comparativos**: Performance entre provas e alunos
- **Exportação Completa**: PDF, Excel e CSV

### Configurações
- **Perfil do Usuário**: Informações pessoais e profissionais
- **Configurações do Sistema**: Tempo limite, notificações
- **Segurança**: 2FA, timeout de sessão
- **Backup de Dados**: Importação e exportação

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS v4** para estilização
- **shadcn/ui** para componentes
- **Recharts** para gráficos
- **Lucide React** para ícones

### Backend
- **Supabase** para autenticação e storage
- **Hono** server rodando no Supabase Edge Functions
- **KV Store** para armazenamento de dados

### Ferramentas
- **Vite** para build e desenvolvimento
- **ESLint** para qualidade de código
- **PostCSS** para processamento CSS

## 📁 Estrutura do Projeto

```
/
├── components/
│   ├── dashboard/           # Páginas do dashboard
│   │   ├── OverviewPage.tsx
│   │   ├── ImportStudentsPage.tsx
│   │   ├── ManageExamsPage.tsx
│   │   ├── ApplyExamsPage.tsx
│   │   ├── GradeExamsPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── ConfigurationPage.tsx
│   ├── ui/                  # Componentes shadcn/ui
│   ├── MainDashboard.tsx    # Layout principal
│   ├── LoginPage.tsx        # Autenticação
│   ├── ExamPage.tsx         # Interface do simulado
│   ├── ResultsPage.tsx      # Resultados detalhados
│   └── CreateExamPage.tsx   # Criador de provas
├── supabase/
│   └── functions/
│       └── server/          # Backend API
├── styles/
│   └── globals.css          # Estilos globais
└── utils/
    └── supabase/           # Configuração Supabase
```

## 🎨 Interface

O sistema foi desenvolvido com base no design SEICE, apresentando:

- **Sidebar Escura**: Navegação intuitiva com ícones
- **Layout Responsivo**: Funciona em desktop, tablet e mobile
- **Tema Consistente**: Cores e tipografia padronizadas
- **Componentes Reutilizáveis**: Interface consistente

## 📊 Funcionalidades de Relatório

### Gráficos Disponíveis
- **Distribuição de Performance**: Gráfico de pizza
- **Performance por Prova**: Gráfico de barras
- **Evolução Temporal**: Gráfico de área
- **Análise Comparativa**: Múltiplas métricas

### Exportações
- **PDF**: Relatórios completos para impressão
- **Excel**: Dados para análise externa
- **CSV**: Importação em outras ferramentas

## 🔒 Segurança

- **Autenticação Supabase**: Login seguro
- **Autorização por Usuário**: Dados isolados
- **Validação de Dados**: Backend e frontend
- **Sessões Seguras**: Tokens JWT

## 📱 Responsividade

O sistema é totalmente responsivo:
- **Desktop**: Interface completa com sidebar
- **Tablet**: Layout adaptado
- **Mobile**: Interface otimizada para touch

## 🖨️ Suporte à Impressão

- **Relatórios**: CSS otimizado para impressão
- **Provas**: Versão impressa das avaliações
- **Resultados**: Certificados e boletins

## 🚀 Como Usar

### Primeiro Acesso
1. Faça login ou crie uma conta
2. Configure seu perfil nas Configurações
3. Importe ou cadastre alunos
4. Crie sua primeira prova

### Fluxo de Trabalho
1. **Preparação**: Importar alunos e criar questões
2. **Aplicação**: Configurar e aplicar provas
3. **Correção**: Analisar resultados automaticamente
4. **Relatórios**: Gerar análises e relatórios

### Aplicação de Provas
1. Selecione a prova no "Aplicar"
2. Configure método (online/impresso/híbrido)
3. Selecione alunos e defina configurações
4. Gere link/QR code ou prepare para impressão

## 📈 Dashboard Analytics

O dashboard oferece visão completa:
- **Estatísticas Gerais**: Total de provas, alunos, médias
- **Performance**: Distribuição de notas
- **Evolução**: Gráficos temporais
- **Ações Rápidas**: Acesso direto às funcionalidades

## 🔧 Configurações Avançadas

### Sistema
- Tempo limite padrão para provas
- Embaralhamento de questões
- Exibição de gabarito
- Auto-salvamento

### Notificações
- Email para submissões
- Relatórios semanais
- Notificações push
- SMS (opcional)

### Segurança
- Autenticação de dois fatores
- Timeout de sessão
- Expiração de senha
- Controle de tentativas

## 💾 Backup e Dados

- **Exportação Completa**: Todos os dados em JSON
- **Backup Seletivo**: Apenas resultados ou configurações
- **Importação**: Restaurar dados de backup
- **Migração**: Transferir entre contas

---

**Sistema SEICE** - Desenvolvido para educadores que buscam excelência em avaliação educacional.