import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, userId: string, data: CreateColumnDto) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    // Pegar a maior ordem atual
    const maxOrder = await this.prisma.column.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const column = await this.prisma.column.create({
      data: {
        ...data,
        projectId,
        order: data.order ?? (maxOrder?.order ?? -1) + 1,
      },
      include: {
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return column;
  }

  async findAll(projectId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const columns = await this.prisma.column.findMany({
      where: { projectId },
      include: {
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return columns;
  }

  async findOne(id: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id },
      include: {
        project: true,
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    if (column.project.ownerId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este projeto');
    }

    return column;
  }

  async update(id: string, userId: string, data: UpdateColumnDto) {
    const column = await this.prisma.column.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    if (column.project.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta coluna',
      );
    }

    return this.prisma.column.update({
      where: { id },
      data,
      include: {
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    if (column.project.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta coluna',
      );
    }

    await this.prisma.column.delete({
      where: { id },
    });

    return { message: 'Coluna excluída com sucesso' };
  }
}
