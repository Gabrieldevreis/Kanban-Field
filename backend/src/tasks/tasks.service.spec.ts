import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    column: {
      findUnique: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockColumnId = 'column-123';
  const mockTaskId = 'task-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma tarefa com sucesso', async () => {
      const createTaskDto = {
        title: 'Nova Tarefa',
        description: 'Descrição da tarefa',
        priority: 'high',
      };

      const mockColumn = {
        id: mockColumnId,
        project: {
          id: 'project-123',
          ownerId: mockUserId,
        },
      };

      const mockTask = {
        id: mockTaskId,
        title: 'Nova Tarefa',
        description: 'Descrição da tarefa',
        priority: 'high',
        columnId: mockColumnId,
        order: 0,
        completed: false,
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.task.findFirst.mockResolvedValue(null);
      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.create(
        mockColumnId,
        mockUserId,
        createTaskDto,
      );

      expect(result).toBeDefined();
      expect(result.title).toBe('Nova Tarefa');
      expect(result.priority).toBe('high');
      expect(mockPrismaService.task.create).toHaveBeenCalled();
    });

    it('deve definir priority como medium por padrão', async () => {
      const createTaskDto = {
        title: 'Tarefa sem prioridade',
      };

      const mockColumn = {
        id: mockColumnId,
        project: {
          ownerId: mockUserId,
        },
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.task.findFirst.mockResolvedValue(null);
      mockPrismaService.task.create.mockResolvedValue({
        id: mockTaskId,
        title: 'Tarefa sem prioridade',
        priority: 'medium',
        columnId: mockColumnId,
        order: 0,
      });

      await service.create(mockColumnId, mockUserId, createTaskDto);

      const createCall = mockPrismaService.task.create.mock.calls[0][0];
      expect(createCall.data.priority).toBe('medium');
    });

    it('deve calcular order automaticamente', async () => {
      const createTaskDto = {
        title: 'Nova Tarefa',
      };

      const mockColumn = {
        id: mockColumnId,
        project: {
          ownerId: mockUserId,
        },
      };

      const maxOrderTask = {
        order: 5,
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.task.findFirst.mockResolvedValue(maxOrderTask);
      mockPrismaService.task.create.mockResolvedValue({
        id: mockTaskId,
        title: 'Nova Tarefa',
        columnId: mockColumnId,
        order: 6,
      });

      await service.create(mockColumnId, mockUserId, createTaskDto);

      const createCall = mockPrismaService.task.create.mock.calls[0][0];
      expect(createCall.data.order).toBe(6);
    });

    it('deve lançar NotFoundException quando coluna não existe', async () => {
      const createTaskDto = {
        title: 'Tarefa',
      };

      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(
        service.create(mockColumnId, mockUserId, createTaskDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não tem acesso', async () => {
      const createTaskDto = {
        title: 'Tarefa',
      };

      const mockColumn = {
        id: mockColumnId,
        project: {
          ownerId: 'outro-usuario-123',
        },
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);

      await expect(
        service.create(mockColumnId, mockUserId, createTaskDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as tarefas de uma coluna', async () => {
      const mockColumn = {
        id: mockColumnId,
        project: {
          ownerId: mockUserId,
        },
      };

      const mockTasks = [
        {
          id: 'task-1',
          title: 'Tarefa 1',
          order: 0,
          completed: false,
        },
        {
          id: 'task-2',
          title: 'Tarefa 2',
          order: 1,
          completed: true,
        },
      ];

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll(mockColumnId, mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Tarefa 1');
      expect(result[1].title).toBe('Tarefa 2');
    });

    it('deve lançar NotFoundException quando coluna não existe', async () => {
      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(service.findAll(mockColumnId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException quando usuário não tem acesso', async () => {
      const mockColumn = {
        id: mockColumnId,
        project: {
          ownerId: 'outro-usuario-123',
        },
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);

      await expect(service.findAll(mockColumnId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma tarefa específica', async () => {
      const mockTask = {
        id: mockTaskId,
        title: 'Tarefa Específica',
        column: {
          id: mockColumnId,
          project: {
            ownerId: mockUserId,
          },
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      const result = await service.findOne(mockTaskId, mockUserId);

      expect(result).toBeDefined();
      expect(result.title).toBe('Tarefa Específica');
    });

    it('deve lançar NotFoundException quando tarefa não existe', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockTaskId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException quando usuário não tem acesso', async () => {
      const mockTask = {
        id: mockTaskId,
        column: {
          project: {
            ownerId: 'outro-usuario-123',
          },
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(service.findOne(mockTaskId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar uma tarefa com sucesso', async () => {
      const updateTaskDto = {
        title: 'Tarefa Atualizada',
        completed: true,
      };

      const mockTask = {
        id: mockTaskId,
        column: {
          project: {
            ownerId: mockUserId,
          },
        },
      };

      const updatedTask = {
        id: mockTaskId,
        title: 'Tarefa Atualizada',
        completed: true,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(
        mockTaskId,
        mockUserId,
        updateTaskDto,
      );

      expect(result.title).toBe('Tarefa Atualizada');
      expect(result.completed).toBe(true);
    });

    it('deve lançar NotFoundException quando tarefa não existe', async () => {
      const updateTaskDto = { title: 'Novo Título' };

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockTaskId, mockUserId, updateTaskDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não tem permissão', async () => {
      const updateTaskDto = { title: 'Novo Título' };

      const mockTask = {
        id: mockTaskId,
        column: {
          project: {
            ownerId: 'outro-usuario-123',
          },
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.update(mockTaskId, mockUserId, updateTaskDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('move', () => {
    it('deve mover uma tarefa para outra coluna', async () => {
      const moveTaskDto = {
        columnId: 'new-column-123',
      };

      const mockTask = {
        id: mockTaskId,
        column: {
          project: {
            id: 'project-123',
            ownerId: mockUserId,
          },
        },
      };

      const mockNewColumn = {
        id: 'new-column-123',
        project: {
          id: 'project-123',
          ownerId: mockUserId,
        },
      };

      const movedTask = {
        id: mockTaskId,
        columnId: 'new-column-123',
        order: 0,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.column.findUnique.mockResolvedValue(mockNewColumn);
      mockPrismaService.task.findFirst.mockResolvedValue(null);
      mockPrismaService.task.update.mockResolvedValue(movedTask);

      const result = await service.move(mockTaskId, mockUserId, moveTaskDto);

      expect(result.columnId).toBe('new-column-123');
      expect(mockPrismaService.task.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando tarefa não existe', async () => {
      const moveTaskDto = {
        columnId: 'new-column-123',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.move(mockTaskId, mockUserId, moveTaskDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException quando coluna destino não existe', async () => {
      const moveTaskDto = {
        columnId: 'new-column-123',
      };

      const mockTask = {
        id: mockTaskId,
        column: {
          project: {
            ownerId: mockUserId,
          },
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(
        service.move(mockTaskId, mockUserId, moveTaskDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não tem permissão', async () => {
      const moveTaskDto = {
        columnId: 'new-column-123',
      };

      const mockTask = {
        id: mockTaskId,
        column: {
          project: {
            ownerId: 'outro-usuario-123',
          },
        },
      };

      const mockNewColumn = {
        id: 'new-column-123',
        project: {
          ownerId: mockUserId,
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.column.findUnique.mockResolvedValue(mockNewColumn);

      await expect(
        service.move(mockTaskId, mockUserId, moveTaskDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deve remover uma tarefa com sucesso', async () => {
      const mockTask = {
        id: mockTaskId,
        column: {
          project: {
            ownerId: mockUserId,
          },
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      const result = await service.remove(mockTaskId, mockUserId);

      expect(result).toEqual({ message: 'Tarefa excluída com sucesso' });
      expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
        where: { id: mockTaskId },
      });
    });

    it('deve lançar NotFoundException quando tarefa não existe', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockTaskId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException quando usuário não tem permissão', async () => {
      const mockTask = {
        id: mockTaskId,
        column: {
          project: {
            ownerId: 'outro-usuario-123',
          },
        },
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(service.remove(mockTaskId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
