import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar um novo usuário e retornar token JWT', async () => {
      const createUserDto = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
      };

      const mockUser = {
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'hashedPassword',
        createdAt: new Date(),
      };

      const mockToken = 'jwt-token-123';

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.register(createUserDto);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
        },
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('deve lançar BadRequestException se email já existe', async () => {
      const createUserDto = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'joao@email.com',
      });

      await expect(service.register(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(createUserDto)).rejects.toThrow(
        'Email já cadastrado',
      );

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('deve fazer hash da senha antes de salvar', async () => {
      const createUserDto = {
        name: 'Maria',
        email: 'maria@email.com',
        password: 'senhaSimples',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-456',
        name: 'Maria',
        email: 'maria@email.com',
        password: 'hashedPassword',
        createdAt: new Date(),
      });
      mockJwtService.signAsync.mockResolvedValue('token');

      await service.register(createUserDto);

      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      const hashedPassword = createCall.data.password;

      expect(hashedPassword).not.toBe('senhaSimples');
      expect(hashedPassword).toBeDefined();
    });
  });

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const loginDto = {
        email: 'joao@email.com',
        password: 'senha123',
      };

      const mockUser = {
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@email.com',
        password: await bcrypt.hash('senha123', 10),
        createdAt: new Date(),
      };

      const mockToken = 'jwt-token-123';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
        },
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('deve lançar UnauthorizedException se usuário não existe', async () => {
      const loginDto = {
        email: 'naoexiste@email.com',
        password: 'senha123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas',
      );
    });

    it('deve lançar UnauthorizedException se senha está incorreta', async () => {
      const loginDto = {
        email: 'joao@email.com',
        password: 'senhaErrada',
      };

      const mockUser = {
        id: 'user-123',
        email: 'joao@email.com',
        password: await bcrypt.hash('senhaCorreta', 10),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciais inválidas',
      );
    });

    it('não deve retornar a senha no objeto de resposta', async () => {
      const loginDto = {
        email: 'joao@email.com',
        password: 'senha123',
      };

      const mockUser = {
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@email.com',
        password: await bcrypt.hash('senha123', 10),
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.login(loginDto);

      expect(result.user).not.toHaveProperty('password');
    });
  });
});
