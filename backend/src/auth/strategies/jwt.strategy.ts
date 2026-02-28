import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  exp?: number;
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'jwt_secret_dev',
    });
  }

  async validate(payload: JwtPayload) {
    // 1️⃣ Buscar usuário pelo ID do token
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 2️⃣ Validar se usuário existe
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // 3️⃣ Retorna usuário válido (fica em req.user)
    return user;
  }
}
