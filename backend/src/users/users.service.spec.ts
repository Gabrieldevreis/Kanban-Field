import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  // Mock do PrismaService - simula o banco de dados
  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===== TESTE 1: Verificar se o serviço foi criado =====
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===== TESTE 2: Criar um usuário com sucesso =====
  describe('create', () => {
    it('deve criar um novo usuário e retornar sem a senha', async () => {
      // ARRANGE (Preparar) - Define os dados de entrada e saída esperada
      const createUserDto = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
      };

      const mockCreatedUser = {
        id: '123',
        name: 'João Silva',
        email: 'joao@email.com',
        createdAt: new Date(),
      };

      // Configura o mock para retornar o usuário criado
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      // ACT (Agir) - Executa a função que estamos testando
      const result = await service.create(createUserDto);

      // ASSERT (Verificar) - Confirma se o resultado é o esperado
      expect(result).toEqual(mockCreatedUser);
      expect(result).not.toHaveProperty('password'); // Senha não deve ser retornada
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          password: expect.any(String), // Senha hasheada (qualquer string)
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
    });

    it('deve fazer hash da senha antes de salvar', async () => {
      const createUserDto = {
        name: 'Maria',
        email: 'maria@email.com',
        password: 'senhaSimples',
      };

      mockPrismaService.user.create.mockResolvedValue({
        id: '456',
        name: 'Maria',
        email: 'maria@email.com',
        createdAt: new Date(),
      });

      await service.create(createUserDto);

      const callArgs = mockPrismaService.user.create.mock.calls[0][0];
      const hashedPassword = callArgs.data.password;

      // Verifica que a senha foi hasheada (não é a senha original)
      expect(hashedPassword).not.toBe('senhaSimples');
      expect(hashedPassword).toBeDefined();
    });
  });

  // ===== TESTE 3: Buscar usuário por email =====
  describe('findByEmail', () => {
    it('deve retornar um usuário quando encontrado', async () => {
      const mockUser = {
        id: '123',
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'hashedPassword',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail('joao@email.com');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'joao@email.com' },
      });
    });

    it('deve retornar null quando usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('naoexiste@email.com');

      expect(result).toBeNull();
    });
  });

  // ===== TESTE 4: Buscar usuário por ID =====
  describe('findById', () => {
    it('deve retornar um usuário sem a senha', async () => {
      const mockUser = {
        id: '123',
        name: 'João Silva',
        email: 'joao@email.com',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('123');

      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('password');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
    });
  });
});
