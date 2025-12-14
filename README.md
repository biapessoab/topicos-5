# Saúde+ Preventiva

Sistema de Apoio Inteligente para Hábitos Saudáveis

## Sobre o Projeto

O **Saúde+ Preventiva** é um sistema web desenvolvido para auxiliar estudantes universitários e jovens profissionais a manterem hábitos mais saudáveis, focando em:
- Qualidade do sono
- Prática de exercícios
- Alimentação equilibrada
- Saúde mental

## Funcionalidades Principais (MVP)

- **RF01-03**: Cadastro, autenticação e recuperação de senha
- **RF04**: Questionário de hábitos (4 áreas de saúde)
- **RF05**: Diagnóstico personalizado baseado em IA (sistema de regras)
- **RF06**: Recomendação de 2-3 metas semanais
- **RF07**: Registro de progresso (checkboxes)
- **RF08**: Dashboard com visualização de progresso
- **RF09**: Dicas educativas personalizadas
- **RF10**: Gestão de conteúdo (admin)

## Stack Tecnológico

### Frontend
- React.js 18
- Tailwind CSS
- React Router DOM
- Axios

### Backend
- Node.js + Express
- PostgreSQL (Supabase)
- JWT para autenticação
- Bcrypt para hash de senhas

### Deploy
- Frontend: Vercel
- Backend: Render
- Banco: Supabase

## Pré-requisitos

Antes de começar, você precisa ter instalado:
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Git](https://git-scm.com/)
- Conta no [Supabase](https://supabase.com) (gratuita)

## Instalação e Configuração

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/saude-preventiva.git
cd saude-preventiva
```

### 2. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **SQL Editor** e execute o script `sql_schema.sql` completo
4. Anote a **URL** e a **API Key** (Settings → API)

### 3. Configurar Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env`:

```bash
cp .env.example .env
```

Edite o `.env` com seus dados:

```env
PORT=3001
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-aqui
JWT_SECRET=sua-chave-secreta-muito-forte-aqui
NODE_ENV=development
```

Para gerar um JWT_SECRET seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Configurar Frontend

```bash
cd ../frontend
npm install
```

Crie o arquivo `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 5. Executar o Projeto

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

O backend estará rodando em `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

O frontend estará rodando em `http://localhost:3000`

## Estrutura de Arquivos

```
saude-preventiva/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── questionnaireController.js
│   │   │   ├── progressController.js
│   │   │   └── contentController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── questionnaireRoutes.js
│   │   │   ├── progressRoutes.js
│   │   │   └── contentRoutes.js
│   │   ├── services/
│   │   │   └── huggingfaceService.js
│   │   └── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── PrivateRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Questionnaire.jsx
│   │   │   └── Diagnosis.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── package.json
├── sql_schema.sql
└── README.md
```

## Testes

### Testar Cadastro (RF01)
1. Acesse `http://localhost:3000/register`
2. Preencha com dados válidos
3. Verifique se email inválido é rejeitado
4. Verifique se senha fraca é rejeitada

### Testar Questionário (RF04)
1. Faça login
2. Acesse o questionário
3. Preencha as 4 etapas (tempo < 5 minutos)
4. Submeta o formulário

### Testar Diagnóstico (RF05)
1. Após submeter questionário
2. Verifique se diagnóstico é gerado em < 5s
3. Confira se explicações são claras

### Testar Progresso (RF07, RF08)
1. No dashboard, marque metas como concluídas
2. Verifique se barra de progresso atualiza
3. Desmarque e verifique novamente

## Testes Automatizados

Para executar testes:

```bash
cd backend
npm test
```

## Deploy

### Deploy do Frontend (Vercel)

1. Crie conta no [Vercel](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure:
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
4. Deploy!

### Deploy do Backend (Render)

1. Crie conta no [Render](https://render.com)
2. Crie novo Web Service
3. Conecte repositório GitHub
4. Configure:
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Adicione variáveis de ambiente (Environment Variables)
6. Deploy!

### Atualizar URL do Backend no Frontend

Após deploy do backend, atualize `frontend/src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: 'https://topicos-5.onrender.com'
});
```

## Requisitos Atendidos

### Funcionais Essenciais (MVP)
- [x] RF01: Cadastro de Usuário
- [x] RF02: Autenticação
- [x] RF03: Recuperação de Senha
- [x] RF04: Questionário de Hábitos
- [x] RF05: Geração de Diagnóstico (IA)
- [x] RF06: Recomendação de Metas
- [x] RF07: Registro de Progresso
- [x] RF08: Visualização de Progresso
- [x] RF09: Conteúdo Educativo
- [x] RF10: Gestão de Conteúdo

### Não-Funcionais Essenciais
- [x] RNF01: Usabilidade (questionário < 5min)
- [x] RNF02: Responsividade
- [x] RNF03: Desempenho (páginas < 3s, diagnóstico < 5s)
- [x] RNF04: Segurança (bcrypt)
- [x] RNF05: LGPD
- [x] RNF06: Idioma (PT-BR)
- [x] RNF07: Manutenibilidade
- [x] RNF08: Controle de Versão (Git)

## Roadmap Futuro

### Entrega 2
- [ ] RF12: Histórico de progresso
- [ ] RF14: Gamificação (badges)
- [ ] RF13: Notificações por email
- [ ] RF15: Refazer questionário

### Entrega 3
- [ ] RF16: Painel institucional
- [ ] RF11: Login social (Google)
- [ ] RNF10: Integração com APIs externas

## Equipe

- **Ana Beatriz Braz** - Desenvolvimento e Implementação
- **Beatriz Fulgêncio** - Desenvolvimento e Implementação
- **Letícia Guimarães** - Desenvolvimento e Implementação
- **Thiago Cardozo** - Desenvolvimento e Implementação