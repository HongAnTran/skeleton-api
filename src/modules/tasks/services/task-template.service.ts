import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTaskTemplateDto } from '../dto/task-template/create-task-template.dto';
import { UpdateTaskTemplateDto } from '../dto/task-template/update-task-template.dto';
import { QueryTaskTemplateDto } from '../dto/task-template/query-task-template.dto';

@Injectable()
export class TaskTemplateService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateTaskTemplateDto) {
    return this.prisma.taskTemplate.create({
      data: {
        ...createDto,
        userId,
      },
      include: {
        schedules: true,
      },
    });
  }

  async findAll(userId: string, query: QueryTaskTemplateDto) {
    const where: any = { userId };

    if (query.scope) {
      where.scope = query.scope;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.taskTemplate.findMany({
      where,
      include: {
        schedules: true,
        _count: {
          select: {
            instances: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id, userId },
      include: {
        schedules: {
          include: {
            cycles: true,
          },
        },
        instances: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`TaskTemplate with ID ${id} not found`);
    }

    return template;
  }

  async update(userId: string, id: string, updateDto: UpdateTaskTemplateDto) {
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new NotFoundException(`TaskTemplate with ID ${id} not found`);
    }

    return this.prisma.taskTemplate.update({
      where: { id },
      data: updateDto,
      include: {
        schedules: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new NotFoundException(`TaskTemplate with ID ${id} not found`);
    }

    // Check if there are active schedules
    const activeSchedules = await this.prisma.taskSchedule.count({
      where: {
        templateId: id,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    });

    if (activeSchedules > 0) {
      throw new BadRequestException(
        'Cannot delete template with active schedules',
      );
    }

    return this.prisma.taskTemplate.delete({
      where: { id },
    });
  }

  async toggleActive(userId: string, id: string) {
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new NotFoundException(`TaskTemplate with ID ${id} not found`);
    }

    return this.prisma.taskTemplate.update({
      where: { id },
      data: { isActive: !template.isActive },
    });
  }

  async getStatistics(userId: string, id: string) {
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new NotFoundException(`TaskTemplate with ID ${id} not found`);
    }

    const [totalInstances, completedInstances, approvedInstances] =
      await Promise.all([
        this.prisma.taskInstance.count({
          where: { templateId: id },
        }),
        this.prisma.taskInstance.count({
          where: { templateId: id, status: 'COMPLETED' },
        }),
        this.prisma.taskInstance.count({
          where: { templateId: id, status: 'APPROVED' },
        }),
      ]);

    return {
      totalInstances,
      completedInstances,
      approvedInstances,
      completionRate:
        totalInstances > 0
          ? ((completedInstances + approvedInstances) / totalInstances) * 100
          : 0,
    };
  }
}
