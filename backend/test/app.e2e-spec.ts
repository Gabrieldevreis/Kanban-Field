import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('KanbanField API - E2E Tests', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: string;
  let projectId: string;
  let columnId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Verificação da API (e2e)', () => {
    it('GET / - deve retornar Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('2. Autenticação - Registro (e2e)', () => {
    it('POST /auth/register - deve criar um novo usuário e retornar token', async () => {
      const newUser = {
        name: 'Teste E2E',
        email: `teste${Date.now()}@email.com`,
        password: 'senha123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user).not.toHaveProperty('password');

      authToken = response.body.access_token;
      userId = response.body.user.id;
    });

    it('POST /auth/register - não deve aceitar email duplicado', async () => {
      const userData = {
        name: 'Usuário Duplicado',
        email: `duplicado${Date.now()}@email.com`,
        password: 'senha123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Email já cadastrado');
    });

    it('POST /auth/register - deve validar campos obrigatórios', async () => {
      const invalidUser = {
        name: '',
        email: 'email-invalido',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);
    });
  });

  describe('3. Autenticação - Login (e2e)', () => {
    let testUserEmail: string;
    let testUserPassword: string;

    beforeAll(async () => {
      testUserEmail = `login${Date.now()}@email.com`;
      testUserPassword = 'senha123';

      await request(app.getHttpServer()).post('/auth/register').send({
        name: 'Usuário Login',
        email: testUserEmail,
        password: testUserPassword,
      });
    });

    it('POST /auth/login - deve fazer login e retornar token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('POST /auth/login - não deve fazer login com senha incorreta', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: 'senhaErrada',
        })
        .expect(401);
    });

    it('POST /auth/login - não deve fazer login com email inexistente', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'naoexiste@email.com',
          password: 'senha123',
        })
        .expect(401);
    });
  });

  describe('4. Projetos - CRUD (e2e)', () => {
    it('POST /projects - deve criar um projeto', async () => {
      const newProject = {
        title: 'Projeto E2E',
        description: 'Projeto de teste E2E',
        icon: 'fa-chart-line',
        color: '#3B82F6',
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProject)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newProject.title);
      expect(response.body.description).toBe(newProject.description);
      expect(response.body.status).toBe('active');
      expect(response.body.tasks).toBe(0);
      expect(response.body.progress).toBe(0);

      projectId = response.body.id;
    });

    it('POST /projects - deve bloquear criação sem autenticação', async () => {
      const newProject = {
        title: 'Projeto Sem Auth',
        icon: 'fa-chart-line',
        color: '#3B82F6',
      };

      await request(app.getHttpServer())
        .post('/projects')
        .send(newProject)
        .expect(401);
    });

    it('GET /projects - deve listar todos os projetos do usuário', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalPages');
      expect(response.body.meta).toHaveProperty('hasNextPage');
      expect(response.body.meta).toHaveProperty('hasPreviousPage');
    });

    it('GET /projects?page=1&limit=5 - deve respeitar parâmetros de paginação', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('GET /projects/:id - deve retornar um projeto específico', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('columns');
    });

    it('PATCH /projects/:id - deve atualizar um projeto', async () => {
      const updateData = {
        title: 'Projeto E2E Atualizado',
        description: 'Descrição atualizada',
      };

      const response = await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });

    it('GET /projects/:id - deve retornar 404 para projeto inexistente', async () => {
      await request(app.getHttpServer())
        .get('/projects/id-inexistente-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('5. Colunas - CRUD (e2e)', () => {
    it('POST /projects/:projectId/columns - deve criar uma coluna', async () => {
      const newColumn = {
        title: 'To Do',
      };

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectId}/columns`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newColumn)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newColumn.title);
      expect(response.body.order).toBeDefined();

      columnId = response.body.id;
    });

    it('POST /projects/:projectId/columns - deve criar múltiplas colunas com ordem automática', async () => {
      await request(app.getHttpServer())
        .post(`/projects/${projectId}/columns`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'In Progress' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/projects/${projectId}/columns`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Done' })
        .expect(201);

      expect(response.body.order).toBeGreaterThan(0);
    });

    it('GET /projects/:projectId/columns - deve listar todas as colunas', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${projectId}/columns`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('PATCH /projects/:projectId/columns/:id - deve atualizar uma coluna', async () => {
      const updateData = {
        title: 'Backlog',
      };

      const response = await request(app.getHttpServer())
        .patch(`/projects/${projectId}/columns/${columnId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
    });
  });

  describe('6. Tarefas - CRUD (e2e)', () => {
    it('POST /columns/:columnId/tasks - deve criar uma tarefa', async () => {
      const newTask = {
        title: 'Tarefa E2E',
        description: 'Descrição da tarefa',
        priority: 'high',
      };

      const response = await request(app.getHttpServer())
        .post(`/columns/${columnId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newTask.title);
      expect(response.body.description).toBe(newTask.description);
      expect(response.body.priority).toBe(newTask.priority);
      expect(response.body.completed).toBe(false);

      taskId = response.body.id;
    });

    it('POST /columns/:columnId/tasks - deve criar tarefa com prioridade padrão', async () => {
      const newTask = {
        title: 'Tarefa sem prioridade',
      };

      const response = await request(app.getHttpServer())
        .post(`/columns/${columnId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask)
        .expect(201);

      expect(response.body.priority).toBe('medium');
    });

    it('GET /columns/:columnId/tasks - deve listar todas as tarefas', async () => {
      const response = await request(app.getHttpServer())
        .get(`/columns/${columnId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /columns/:columnId/tasks/:id - deve retornar uma tarefa específica', async () => {
      const response = await request(app.getHttpServer())
        .get(`/columns/${columnId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body).toHaveProperty('title');
    });

    it('PATCH /columns/:columnId/tasks/:id - deve atualizar uma tarefa', async () => {
      const updateData = {
        title: 'Tarefa E2E Atualizada',
        completed: true,
        priority: 'low',
      };

      const response = await request(app.getHttpServer())
        .patch(`/columns/${columnId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.completed).toBe(true);
      expect(response.body.priority).toBe(updateData.priority);
    });

    it('PATCH /columns/:columnId/tasks/:id/move - deve mover tarefa para outra coluna', async () => {
      const newColumn = await request(app.getHttpServer())
        .post(`/projects/${projectId}/columns`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Nova Coluna' });

      const newColumnId = newColumn.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/columns/${columnId}/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ columnId: newColumnId })
        .expect(200);

      expect(response.body.columnId).toBe(newColumnId);
    });

    it('DELETE /columns/:columnId/tasks/:id - deve excluir uma tarefa', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/columns/${columnId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('excluída com sucesso');

      await request(app.getHttpServer())
        .get(`/columns/${columnId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('7. Segurança e Permissões (e2e)', () => {
    let otherUserToken: string;

    beforeAll(async () => {
      const otherUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Outro Usuário',
          email: `outro${Date.now()}@email.com`,
          password: 'senha123',
        });

      otherUserToken = otherUser.body.access_token;
    });

    it('GET /projects/:id - não deve permitir acesso ao projeto de outro usuário', async () => {
      await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);
    });

    it('PATCH /projects/:id - não deve permitir edição de projeto de outro usuário', async () => {
      await request(app.getHttpServer())
        .patch(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Tentativa de Hack' })
        .expect(403);
    });

    it('DELETE /projects/:id - não deve permitir exclusão de projeto de outro usuário', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('todas as rotas devem bloquear acesso sem token', async () => {
      await request(app.getHttpServer()).get('/projects').expect(401);

      await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .expect(401);

      await request(app.getHttpServer())
        .post('/projects')
        .send({ name: 'Test' })
        .expect(401);

      await request(app.getHttpServer())
        .post(`/projects/${projectId}/columns`)
        .send({ name: 'Test' })
        .expect(401);

      await request(app.getHttpServer())
        .post(`/columns/${columnId}/tasks`)
        .send({ title: 'Test' })
        .expect(401);
    });
  });

  describe('8. Fluxo Completo Kanban (e2e)', () => {
    it('deve simular um fluxo completo de uso do Kanban', async () => {
      const userEmail = `fluxo${Date.now()}@email.com`;

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Usuário Fluxo',
          email: userEmail,
          password: 'senha123',
        })
        .expect(201);

      const token = registerResponse.body.access_token;

      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Meu Projeto Kanban',
          description: 'Projeto de exemplo',
          icon: 'fa-chart-line',
          color: '#3B82F6',
        })
        .expect(201);

      const projectId = projectResponse.body.id;

      const todoColumn = await request(app.getHttpServer())
        .post(`/projects/${projectId}/columns`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'To Do' })
        .expect(201);

      const inProgressColumn = await request(app.getHttpServer())
        .post(`/projects/${projectId}/columns`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'In Progress' })
        .expect(201);

      const doneColumn = await request(app.getHttpServer())
        .post(`/projects/${projectId}/columns`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Done' })
        .expect(201);

      const task1 = await request(app.getHttpServer())
        .post(`/columns/${todoColumn.body.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Implementar login',
          description: 'Criar tela de login',
          priority: 'high',
        })
        .expect(201);

      const task2 = await request(app.getHttpServer())
        .post(`/columns/${todoColumn.body.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Criar documentação',
          priority: 'low',
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/columns/${todoColumn.body.id}/tasks/${task1.body.id}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ columnId: inProgressColumn.body.id })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/columns/${inProgressColumn.body.id}/tasks/${task1.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: true })
        .expect(200);

      await request(app.getHttpServer())
        .patch(
          `/columns/${inProgressColumn.body.id}/tasks/${task1.body.id}/move`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({ columnId: doneColumn.body.id })
        .expect(200);

      const finalProject = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(finalProject.body.columns).toHaveLength(3);
      expect(finalProject.body.tasks).toBe(2);
    });
  });

  describe('9. Limpeza - DELETE (e2e)', () => {
    it('DELETE /projects/:projectId/columns/:id - deve excluir uma coluna', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/projects/${projectId}/columns/${columnId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('excluída com sucesso');
    });

    it('DELETE /projects/:id - deve excluir um projeto', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('excluído com sucesso');

      await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
