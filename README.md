# 📋 KanbanField

Sistema de gerenciamento de projetos baseado em quadros Kanban com NestJS e Angular.

## 🌐 Deploy

**[https://kanbanfield.up.railway.app/login](https://kanbanfield.up.railway.app/login)**

---

## 📑 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Framework, Linguagem e Ferramentas](#-framework-linguagem-e-ferramentas)
- [Escolhas Tecnológicas](#-escolhas-tecnológicas)
- [Princípios de Software](#-princípios-de-software)
- [Desafios e Problemas](#-desafios-e-problemas)
- [Melhorias e Próximas Implementações](#-melhorias-e-próximas-implementações)
- [Vídeo de Apresentação](#-vídeo-de-apresentação)
- [Como Rodar](#-como-rodar)
- [Sobre Mim](#-sobre-mim)
- [Contato](#-contato)

---

## 🎯 Sobre o Projeto

**KanbanField** é uma aplicação full-stack para gerenciamento de projetos com metodologia Kanban. Permite criar projetos, organizar tarefas em colunas personalizáveis e acompanhar o progresso visualmente.

**Funcionalidades principais:**
- 🔐 Autenticação JWT
- 📊 Múltiplos projetos
- 📝 Drag-and-drop de tarefas
- 🎨 Interface responsiva
- 🧪 Testes unitários e E2E

---

## 🛠️ Framework, Linguagem e Ferramentas

### Backend
- **NestJS 11** - Framework Node.js progressivo com arquitetura modular
- **TypeScript 5.7** - Type-safety e melhor DX
- **Prisma 6.19** - ORM com type-safety e migrations automáticas
- **PostgreSQL 17** - Banco de dados relacional
- **Passport JWT** - Autenticação com tokens
- **Bcrypt** - Hash de senhas
- **Jest + SuperTest** - Testes unitários e E2E

### Frontend
- **Angular 17** - Framework SPA completo
- **TypeScript 5.4** - Linguagem tipada
- **RxJS 7.8** - Programação reativa
- **Angular CDK** - Drag-and-drop nativo
- **FontAwesome** - Ícones vetoriais

### DevOps
- **Docker** - Containerização do PostgreSQL
- **Makefile** - Automação de comandos
- **Railway** - Deploy em produção

---

## 🤔 Escolhas Tecnológicas

### NestJS
Escolhi **NestJS** por:
- Arquitetura modular bem definida (similar ao Angular)
- TypeScript nativo com decorators
- Dependency Injection
- Ecossistema rico (Passport, Swagger, validação)
- Facilita escalabilidade e testes

### Angular
Escolhi **Angular** por:
- Framework completo (routing, forms, HTTP, etc.)
- TypeScript
- RxJS integrado para programação reativa
- Angular CDK para drag-and-drop
- Estrutura consistente para projetos grandes

### Prisma
Escolhi **Prisma** por:
- Type-safety superior com geração automática de tipos
- Developer Experience (CLI, migrations, Studio)
- Schema declarativo mais legível
- Queries otimizadas e melhor performance

### PostgreSQL
Escolhi **PostgreSQL** por:
- Relações complexas (users → projects → columns → tasks)
- ACID compliance e integridade transacional
- Schemas bem definidos
- Suporte a JOINs e queries complexas

---

## 📐 Princípios de Software

### SOLID
- **SRP**: Cada service/controller tem responsabilidade única
- **OCP**: Guards e Interceptors extensíveis sem modificar código existente
- **LSP**: DTOs e interfaces substituíveis
- **ISP**: Interfaces específicas e coesas
- **DIP**: Injeção de dependências via constructor

### Outros Princípios
- **Clean Architecture**: Camadas bem definidas (Controllers → Services → Repository)
- **Convention over Configuration**: Seguindo padrões NestJS/Angular

---

## 🚧 Desafios e Problemas

### 1. Drag-and-Drop entre Colunas
**Desafio**: Implementar movimentação fluida de tarefas entre colunas com atualização de ordem.

**Solução**: Utilizei Angular CDK com eventos `cdkDropListDropped`. Criei lógica para detectar mudança de coluna, recalcular ordem e atualizar backend mantendo UI sincronizada.

### 2. Autenticação JWT
**Desafio**: Sistema seguro com proteção de rotas no backend e frontend.

**Solução**: Implementei Passport JWT Strategy + Guards no NestJS. No frontend, criei AuthGuard com interceptor HTTP que adiciona token automaticamente e redireciona ao expirar.

### 3. Relacionamentos Cascata
**Desafio**: Deletar projeto e remover todas colunas/tarefas automaticamente.

**Solução**: Configurei `onDelete: Cascade` no schema Prisma para propagar deleções automaticamente.

### 4. Validação e Tratamento de Erros
**Desafio**: Feedback claro de erros para o usuário.

**Solução**: Usei `class-validator` no backend, exception filters customizados e toasts no frontend com códigos HTTP apropriados.

### 5. Testes Unitários e de Integração
**Desafio**: Garantir qualidade de código com cobertura completa de testes no backend, isolando dependências e testando fluxos E2E.

**Solução**: 
- **Testes Unitários**: Implementei testes com Jest usando mocks do PrismaService para isolar a lógica de negócio. Cada service possui testes que verificam casos de sucesso e falha (auth, projects, columns, tasks, users).
- **Testes E2E**: Criei testes de integração com SuperTest que validam toda a API, testando fluxos completos (registro → login → projetos → colunas → tarefas) e verificando permissões.
- **Mocking**: Usei `jest.fn()` e mocks customizados para isolar dependências externas (PrismaService, JwtService, bcrypt).
- **Validação Completa**: Testes verificam códigos HTTP, estrutura de respostas, casos de erro e segurança (proteção de rotas, ownership de recursos).

---

## 🚀 Melhorias e Próximas Implementações

### Funcionalidades
- **Colaboração em tempo real** - WebSockets para múltiplos usuários
- **Notificações** - Lembretes de prazos e atividades
- **Compartilhamento** - Convidar membros com níveis de permissão
- **Anexos** - Upload de arquivos nas tarefas
- **Filtros avançados** - Busca e ordenação customizável
- **Dashboard** - Gráficos de progresso e estatísticas
- **Templates** - Projetos pré-configurados


---

## 🎥 Vídeo de Apresentação

🎬 **https://jam.dev/c/2c647d5e-5d73-45ec-a25f-9049e7d1db4a**

<!-- Demonstrando: Login, drag-and-drop, criar, editar e excluir board -->

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js >= 18.x
- Docker (recomendado)
- Make (recomendado)

### Instalação Rápida

```bash
# 1. Clone o repositório
git clone <https://github.com/Gabrieldevreis/Kanban-Field>
cd kanban-Field

# 2. Configure o .env
cd backend
cp .env.example .env
# Edite o .env com suas configurações
cd ..

# 3. Inicie tudo de uma vez
make dev
```

A aplicação estará rodando em:
- Frontend: http://localhost:3000
- Backend: http://localhost:8002

### Variáveis de Ambiente (.env)

```env
# JWT
JWT_SECRET="sua_chave_secreta_forte"
JWT_EXPIRES_IN="24h"

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5132/kanban_db
POSTGRES_DB=kanban_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Server
PORT=8002
```

### Comandos Úteis

```bash
make dev          # Inicia backend + frontend + database
make test         # Roda todos os testes
make docker       # Inicia apenas o PostgreSQL
make help         # Lista todos os comandos disponíveis
```

### Instalação Manual

```bash
# Backend
cd backend
npm install
npm run prisma:generate
npx prisma migrate dev
npm run start:dev

# Frontend (novo terminal)
cd frontend
npm install
npm start

# Database (novo terminal)
docker network create kanban-networks 2>/dev/null || true
docker compose up -d
```

---

## 👤 Sobre Mim

Me chamo **Gabriel Reis**, tenho 25 anos e moro em Ibirá (SP). Atualmente curso **Análise e Desenvolvimento de Sistemas (ADS)** na **UNINTER**, polo de **São José do Rio Preto**.

Iniciei minha jornada na programação em 2022, começando meus estudos com **HTML, CSS e JavaScript**. Desde o início, busquei evoluir não apenas tecnicamente, mas também através do networking, participando de comunidades de desenvolvedores que contribuíram significativamente para meu crescimento profissional.

Com o tempo, conheci os frameworks como **React e Angular**. Tive a oportunidade de trabalhar em um SaaS cuja stack principal era **Angular**, experiência que foi fundamental para meu desenvolvimento nesse framework. Durante esse período, também conheci o **NestJS**, especialmente ao participar do desafio da FieldControl, o que despertou meu interesse pelo desenvolvimento back-end.

Atualmente, sigo aprimorando meus conhecimentos em Angular, estudando também conceitos de UI e UX para desenvolver interfaces mais intuitivas e eficientes. Além disso, estou me aprofundando em NestJS, aprendendo Ionic para desenvolvimento mobile e explorando WebSockets para implementação de funcionalidades em tempo real.

Estou em constante evolução, sempre buscando novos desafios e oportunidades para crescer como desenvolvedor. 


---

## 📞 Contato

- **Email**: gabrielreisdev@gmail.com
- **Telefone**: (17) 981241887
- **LinkedIn**: https://www.linkedin.com/in/gabrieldevreis/
- **GitHub**: https://github.com/gabrieldevreis

---
