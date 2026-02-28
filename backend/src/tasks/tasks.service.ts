import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(columnId: string, userId: string, data: CreateTaskDto) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        project: true,
      },
    });

    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    if (column.project.ownerId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este projeto');
    }

    // Pegar a maior ordem atual na coluna
    const maxOrder = await this.prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const task = await this.prisma.task.create({
      data: {
        ...data,
        columnId,
        priority: data.priority || 'medium',
        order: data.order ?? (maxOrder?.order ?? -1) + 1,
      },
    });

    return task;
  }

  async findAll(columnId: string, userId: string) {
    // Verificar se a coluna existe e o usuário tem acesso
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: {
        project: true,
      },
    });

    if (!column) {
      throw new NotFoundException('Coluna não encontrada');
    }

    if (column.project.ownerId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este projeto');
    }

    const tasks = await this.prisma.task.findMany({
      where: { columnId },
      orderBy: {
        order: 'asc',
      },
    });

    return tasks;
  }

  async findOne(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        column: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (task.column.project.ownerId !== userId) {
      throw new ForbiddenException('Você não tem acesso a este projeto');
    }

    return task;
  }

  async update(id: string, userId: string, data: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        column: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (task.column.project.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta tarefa',
      );
    }

    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async move(id: string, userId: string, moveTaskDto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        column: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    // Verificar se a nova coluna existe e o usuário tem acesso
    const newColumn = await this.prisma.column.findUnique({
      where: { id: moveTaskDto.columnId },
      include: {
        project: true,
      },
    });

    if (!newColumn) {
      throw new NotFoundException('Coluna não encontrada');
    }

    if (
      task.column.project.ownerId !== userId ||
      newColumn.project.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para mover esta tarefa',
      );
    }

    // Pegar a maior ordem atual na nova coluna
    const maxOrder = await this.prisma.task.findFirst({
      where: { columnId: moveTaskDto.columnId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.task.update({
      where: { id },
      data: {
        columnId: moveTaskDto.columnId,
        order: moveTaskDto.order ?? (maxOrder?.order ?? -1) + 1,
      },
    });
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        column: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    if (task.column.project.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta tarefa',
      );
    }

    await this.prisma.task.delete({
      where: { id },
    });

    return { message: 'Tarefa excluída com sucesso' };
  }
}
