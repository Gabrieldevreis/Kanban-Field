import { Test, TestingModule } from '@nestjs/testing';
import { ColumnsService } from './columns.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ColumnsService', () => {
  let service: ColumnsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    project: {
      findFirst: jest.fn(),
    },
    column: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockProjectId = 'project-123';
  const mockColumnId = 'column-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColumnsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ColumnsService>(ColumnsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma coluna com sucesso', async () => {
      const createColumnDto = {
        name: 'To Do',
        color: '#FF5733',
      };

      const mockProject = {
        id: mockProjectId,
        ownerId: mockUserId,
      };

      const mockColumn = {
        id: mockColumnId,
        name: 'To Do',
        color: '#FF5733',
        projectId: mockProjectId,
        order: 0,
        tasks: [],
      };

      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.column.findFirst.mockResolvedValue(null);
      mockPrismaService.column.create.mockResolvedValue(mockColumn);

      const result = await service.create(
        mockProjectId,
        mockUserId,
        createColumnDto,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('To Do');
      expect(result.color).toBe('#FF5733');
      expect(mockPrismaService.column.create).toHaveBeenCalled();
    });

    it('deve definir order automaticamente baseado na última coluna', async () => {
      const createColumnDto = {
        name: 'In Progress',
      };

      const mockProject = {
        id: mockProjectId,
        ownerId: mockUserId,
      };

      const maxOrderColumn = {
        order: 2,
      };

      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.column.findFirst.mockResolvedValue(maxOrderColumn);
      mockPrismaService.column.create.mockResolvedValue({
        id: mockColumnId,
        name: 'In Progress',
        projectId: mockProjectId,
        order: 3,
        tasks: [],
      });

      await service.create(mockProjectId, mockUserId, createColumnDto);

      const createCall = mockPrismaService.column.create.mock.calls[0][0];
      expect(createCall.data.order).toBe(3);
    });

    it('deve lançar NotFoundException quando projeto não existe', async () => {
      const createColumnDto = {
        name: 'To Do',
      };

      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockProjectId, mockUserId, createColumnDto),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.create(mockProjectId, mockUserId, createColumnDto),
      ).rejects.toThrow('Projeto não encontrado');
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as colunas de um projeto', async () => {
      const mockProject = {
        id: mockProjectId,
        ownerId: mockUserId,
      };

      const mockColumns = [
        {
          id: 'col-1',
          name: 'To Do',
          order: 0,
          projectId: mockProjectId,
          tasks: [],
        },
        {
          id: 'col-2',
          name: 'In Progress',
          order: 1,
          projectId: mockProjectId,
          tasks: [],
        },
      ];

      mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
      mockPrismaService.column.findMany.mockResolvedValue(mockColumns);

      const result = await service.findAll(mockProjectId, mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('To Do');
      expect(result[1].name).toBe('In Progress');
      expect(mockPrismaService.column.findMany).toHaveBeenCalledWith({
        where: { projectId: mockProjectId },
        include: expect.any(Object),
        orderBy: { order: 'asc' },
      });
    });

    it('deve lançar NotFoundException quando projeto não existe', async () => {
      mockPrismaService.project.findFirst.mockResolvedValue(null);

      await expect(service.findAll(mockProjectId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma coluna específica', async () => {
      const mockColumn = {
        id: mockColumnId,
        name: 'To Do',
        projectId: mockProjectId,
        project: {
          id: mockProjectId,
          ownerId: mockUserId,
        },
        tasks: [],
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);

      const result = await service.findOne(mockColumnId, mockUserId);

      expect(result).toBeDefined();
      expect(result.name).toBe('To Do');
    });

    it('deve lançar NotFoundException quando coluna não existe', async () => {
      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockColumnId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException quando usuário não tem acesso', async () => {
      const mockColumn = {
        id: mockColumnId,
        name: 'To Do',
        project: {
          id: mockProjectId,
          ownerId: 'outro-usuario-123',
        },
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);

      await expect(service.findOne(mockColumnId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('deve atualizar uma coluna com sucesso', async () => {
      const updateColumnDto = {
        name: 'Done',
        color: '#00FF00',
      };

      const mockColumn = {
        id: mockColumnId,
        name: 'To Do',
        project: {
          id: mockProjectId,
          ownerId: mockUserId,
        },
      };

      const updatedColumn = {
        id: mockColumnId,
        name: 'Done',
        color: '#00FF00',
        projectId: mockProjectId,
        tasks: [],
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.column.update.mockResolvedValue(updatedColumn);

      const result = await service.update(
        mockColumnId,
        mockUserId,
        updateColumnDto,
      );

      expect(result.name).toBe('Done');
      expect(result.color).toBe('#00FF00');
    });

    it('deve lançar NotFoundException quando coluna não existe', async () => {
      const updateColumnDto = { name: 'Done' };

      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockColumnId, mockUserId, updateColumnDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException quando usuário não tem permissão', async () => {
      const updateColumnDto = { name: 'Done' };

      const mockColumn = {
        id: mockColumnId,
        project: {
          ownerId: 'outro-usuario-123',
        },
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);

      await expect(
        service.update(mockColumnId, mockUserId, updateColumnDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('deve remover uma coluna com sucesso', async () => {
      const mockColumn = {
        id: mockColumnId,
        project: {
          ownerId: mockUserId,
        },
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.column.delete.mockResolvedValue(mockColumn);

      const result = await service.remove(mockColumnId, mockUserId);

      expect(result).toEqual({ message: 'Coluna excluída com sucesso' });
      expect(mockPrismaService.column.delete).toHaveBeenCalledWith({
        where: { id: mockColumnId },
      });
    });

    it('deve lançar NotFoundException quando coluna não existe', async () => {
      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockColumnId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ForbiddenException quando usuário não tem permissão', async () => {
      const mockColumn = {
        id: mockColumnId,
        project: {
          ownerId: 'outro-usuario-123',
        },
      };

      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);

      await expect(service.remove(mockColumnId, mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
