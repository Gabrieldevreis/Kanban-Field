import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockProjectId = 'project-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um projeto com sucesso', async () => {
      const createProjectDto = {
        name: 'Projeto Teste',
        description: 'Descrição do projeto',
      };

      const mockProject = {
        id: mockProjectId,
        name: 'Projeto Teste',
        description: 'Descrição do projeto',
        status: 'active',
        ownerId: mockUserId,
        createdAt: new Date(),
        columns: [],
        owner: {
          id: mockUserId,
          name: 'João',
          email: 'joao@email.com',
        },
      };

      mockPrismaService.project.create.mockResolvedValue(mockProject);

      const result = await service.create(mockUserId, createProjectDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Projeto Teste');
      expect(result.status).toBe('active');
      expect(result.tasks).toBe(0);
      expect(result.progress).toBe(0);
      expect(mockPrismaService.project.create).toHaveBeenCalledWith({
        data: {
          ...createProjectDto,
          ownerId: mockUserId,
          status: 'active',
        },
        include: expect.any(Object),
      });
    });

    it('deve calcular progresso corretamente quando há tarefas', async () => {
      const createProjectDto = {
        name: 'Projeto com Tarefas',
      };

      const mockProject = {
        id: mockProjectId,
        name: 'Projeto com Tarefas',
        status: 'active',
        ownerId: mockUserId,
        createdAt: new Date(),
        columns: [
          {
            id: 'col-1',
            tasks: [
              { id: 'task-1', completed: true },
              { id: 'task-2', completed: false },
            ],
          },
        ],
        owner: {
          id: mockUserId,
          name: 'João',
          email: 'joao@email.com',
        },
      };

      mockPrismaService.project.create.mockResolvedValue(mockProject);

      const result = await service.create(mockUserId, createProjectDto);

      expect(result.tasks).toBe(2);
      expect(result.progress).toBe(50); // 1 de 2 completas = 50%
      expect(result.status).toBe('active');
    });

    it('deve definir status como completed quando todas as tarefas estão completas', async () => {
      const createProjectDto = {
        name: 'Projeto Completo',
      };

      const mockProject = {
        id: mockProjectId,
        name: 'Projeto Completo',
        status: 'active',
        ownerId: mockUserId,
        createdAt: new Date(),
        columns: [
          {
            id: 'col-1',
            tasks: [
              { id: 'task-1', completed: true },
              { id: 'task-2', completed: true },
            ],
          },
        ],
        owner: {
          id: mockUserId,
          name: 'João',
          email: 'joao@email.com',
        },
      };

      mockPrismaService.project.create.mockResolvedValue(mockProject);

      const result = await service.create(mockUserId, createProjectDto);

      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
    });
  });

  describe('findAll', () => {
    it('deve retornar projetos paginados com metadados', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Projeto 1',
          status: 'active',
          ownerId: mockUserId,
          createdAt: new Date(),
          columns: [],
          owner: { id: mockUserId, name: 'João', email: 'joao@email.com' },
        },
        {
          id: 'project-2',
          name: 'Projeto 2',
          status: 'active',
          ownerId: mockUserId,
          createdAt: new Date(),
          columns: [],
          owner: { id: mockUserId, name: 'João', email: 'joao@email.com' },
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);
      mockPrismaService.project.count.mockResolvedValue(15);

      const result = await service.findAll(mockUserId, 1, 12);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(15);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(12);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('deve aplicar paginação corretamente', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.project.count.mockResolvedValue(25);

      await service.findAll(mockUserId, 2, 12);

      expect(mockPrismaService.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 12, // (2 - 1) * 12
          take: 12,
        }),
      );
    });

    it('deve calcular estatísticas para cada projeto', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Projeto 1',
          status: 'active',
          ownerId: mockUserId,
          createdAt: new Date(),
          columns: [
            {
              id: 'col-1',
              tasks: [
                { id: 'task-1', completed: true },
                { id: 'task-2', completed: false },
                { id: 'task-3', completed: true },
              ],
            },
          ],
          owner: { id: mockUserId, name: 'João', email: 'joao@email.com' },
        },
      ];

      mockPrismaService.project.findMany.mockResolvedValue(mockProjects);
      mockPrismaService.project.count.mockResolvedValue(1);

      const result = await service.findAll(mockUserId, 1, 12);

      expect(result.data[0].tasks).toBe(3);
      expect(result.data[0].progress).toBe(67); // 2 de 3 = 67%
    });

    it('deve indicar corretamente quando está na última página', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([]);
      mockPrismaService.project.count.mockResolvedValue(12);

      const result = await service.findAll(mockUserId, 1, 12);

      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('deve retornar um projeto específico', async () => {
      const mockProject = {
        id: mockProjectId,
        name: 'Projeto Único',
        status: 'active',
        ownerId: mockUserId,
        createdAt: new Date(),
        columns: [],
        owner: { id: mockUserId, name: 'João', email: 'joao@email.com' },
      };

      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

      const result = await service.findOne(mockProjectId, mockUserId);

      expect(result).toBeDefined();
      expect(result.name).toBe('Projeto Único');
      expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockProjectId,
          ownerId: mockUserId,
        },
        include: expect.any(Object),
      });
    });

    it('deve lançar NotFoundException quando projeto não existe', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockProjectId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.findOne(mockProjectId, mockUserId)).rejects.toThrow(
        'Projeto não encontrado',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar um projeto com sucesso', async () => {
      const updateProjectDto = {
        name: 'Projeto Atualizado',
        description: 'Nova descrição',
      };

      const existingProject = {
        id: mockProjectId,
        ownerId: mockUserId,
      };

      const updatedProject = {
        id: mockProjectId,
        name: 'Projeto Atualizado',
        description: 'Nova descrição',
        status: 'active',
        ownerId: mockUserId,
        createdAt: new Date(),
        columns: [],
      };

      mockPrismaService.project.findUnique.mockResolvedValue(existingProject);
      mockPrismaService.project.update.mockResolvedValue(updatedProject);

      const result = await service.update(
        mockProjectId,
        mockUserId,
        updateProjectDto,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Projeto Atualizado');
      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id: mockProjectId },
        data: updateProjectDto,
        include: expect.any(Object),
      });
    });

    it('deve lançar NotFoundException quando projeto não existe', async () => {
      const updateProjectDto = { name: 'Novo Nome' };

      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockProjectId, mockUserId, updateProjectDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não é o dono', async () => {
      const updateProjectDto = { name: 'Novo Nome' };

      const existingProject = {
        id: mockProjectId,
        ownerId: 'outro-usuario-123',
      };

      mockPrismaService.project.findUnique.mockResolvedValue(existingProject);

      await expect(
        service.update(mockProjectId, mockUserId, updateProjectDto),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.update(mockProjectId, mockUserId, updateProjectDto),
      ).rejects.toThrow('Você não tem permissão para editar este projeto');
    });
  });

  describe('remove', () => {
    it('deve remover um projeto com sucesso', async () => {
      const existingProject = {
        id: mockProjectId,
        ownerId: mockUserId,
      };

      mockPrismaService.project.findUnique.mockResolvedValue(existingProject);
      mockPrismaService.project.delete.mockResolvedValue(existingProject);

      const result = await service.remove(mockProjectId, mockUserId);

      expect(result).toEqual({ message: 'Projeto excluído com sucesso' });
      expect(mockPrismaService.project.delete).toHaveBeenCalledWith({
        where: { id: mockProjectId },
      });
    });

    it('deve lançar NotFoundException quando projeto não existe', async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockProjectId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException quando usuário não é o dono', async () => {
      const existingProject = {
        id: mockProjectId,
        ownerId: 'outro-usuario-123',
      };

      mockPrismaService.project.findUnique.mockResolvedValue(existingProject);

      await expect(service.remove(mockProjectId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );

      await expect(service.remove(mockProjectId, mockUserId)).rejects.toThrow(
        'Você não tem permissão para excluir este projeto',
      );
    });
  });
});
