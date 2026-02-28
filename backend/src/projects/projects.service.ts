import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        ...data,
        ownerId: userId,
        status: data.status || 'active',
      },
      include: {
        columns: {
          include: {
            tasks: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const allTasks = project.columns.flatMap((col) => col.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((task) => task.completed).length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Determinar status baseado nas tasks
    let status = project.status;
    if (totalTasks > 0) {
      status = completedTasks === totalTasks ? 'completed' : 'active';
    }

    return {
      ...project,
      status,
      tasks: totalTasks,
      progress,
    };
  }

  async findAll(userId: string, page: number = 1, limit: number = 12) {
    // Calcular skip baseado na página
    const skip = (page - 1) * limit;

    // Buscar projetos com paginação
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          ownerId: userId,
        },
        include: {
          columns: {
            include: {
              tasks: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      // Contar total de projetos
      this.prisma.project.count({
        where: {
          ownerId: userId,
        },
      }),
    ]);

    // Mapear projetos com estatísticas
    const projectsWithStats = projects.map((project) => {
      const allTasks = project.columns.flatMap((col) => col.tasks);
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter((task) => task.completed).length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      let status = project.status;
      if (totalTasks > 0) {
        status = completedTasks === totalTasks ? 'completed' : 'active';
      }

      return {
        ...project,
        status,
        tasks: totalTasks,
        progress,
      };
    });

    // Retornar com metadados de paginação
    return {
      data: projectsWithStats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        ownerId: userId,
      },
      include: {
        columns: {
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
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    const allTasks = project.columns.flatMap((col) => col.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((task) => task.completed).length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Determinar status baseado nas tasks
    let status = project.status;
    if (totalTasks > 0) {
      status = completedTasks === totalTasks ? 'completed' : 'active';
    }

    return {
      ...project,
      status,
      tasks: totalTasks,
      progress,
    };
  }

  async update(id: string, userId: string, data: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este projeto',
      );
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data,
      include: {
        columns: {
          include: {
            tasks: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    const allTasks = updated.columns.flatMap((col) => col.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((task) => task.completed).length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Determinar status baseado nas tasks
    let status = updated.status;
    if (totalTasks > 0) {
      status = completedTasks === totalTasks ? 'completed' : 'active';
    }

    return {
      ...updated,
      status,
      tasks: totalTasks,
      progress,
    };
  }

  async remove(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Projeto não encontrado');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este projeto',
      );
    }

    await this.prisma.project.delete({
      where: { id },
    });

    return { message: 'Projeto excluído com sucesso' };
  }
}
