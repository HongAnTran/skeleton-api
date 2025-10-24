import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTaskCycleDto } from '../dto/task-cycle/create-task-cycle.dto';
import { UpdateTaskCycleDto } from '../dto/task-cycle/update-task-cycle.dto';
import { QueryTaskCycleDto } from '../dto/task-cycle/query-task-cycle.dto';
import { TaskScope, TaskStatusV2 } from '@prisma/client';

@Injectable()
export class TaskCycleService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateTaskCycleDto) {
    // Verify schedule exists and belongs to user
    const schedule = await this.prisma.taskSchedule.findFirst({
      where: {
        id: createDto.scheduleId,
        template: {
          userId,
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('TaskSchedule not found');
    }

    const cycle = await this.prisma.taskCycle.create({
      data: {
        ...createDto,
        periodStart: new Date(createDto.periodStart),
        periodEnd: new Date(createDto.periodEnd),
      },
      include: {
        schedule: {
          include: {
            template: true,
          },
        },
      },
    });

    return cycle;
  }

  async findAll(userId: string, query: QueryTaskCycleDto) {
    const where: any = {
      schedule: {
        template: {
          userId,
        },
      },
    };

    if (query.scheduleId) {
      where.scheduleId = query.scheduleId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.periodStartFrom || query.periodStartTo) {
      where.periodStart = {};
      if (query.periodStartFrom) {
        where.periodStart.gte = new Date(query.periodStartFrom);
      }
      if (query.periodStartTo) {
        where.periodStart.lte = new Date(query.periodStartTo);
      }
    }

    return this.prisma.taskCycle.findMany({
      where,
      include: {
        schedule: {
          include: {
            template: true,
          },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
      orderBy: {
        periodStart: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const cycle = await this.prisma.taskCycle.findFirst({
      where: {
        id,
        schedule: {
          template: {
            userId,
          },
        },
      },
      include: {
        schedule: {
          include: {
            template: true,
          },
        },
        instances: {
          include: {
            employee: true,
            department: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException(`TaskCycle with ID ${id} not found`);
    }

    return cycle;
  }

  async update(userId: string, id: string, updateDto: UpdateTaskCycleDto) {
    const cycle = await this.prisma.taskCycle.findFirst({
      where: {
        id,
        schedule: {
          template: {
            userId,
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException(`TaskCycle with ID ${id} not found`);
    }

    return this.prisma.taskCycle.update({
      where: { id },
      data: updateDto,
      include: {
        schedule: {
          include: {
            template: true,
          },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    const cycle = await this.prisma.taskCycle.findFirst({
      where: {
        id,
        schedule: {
          template: {
            userId,
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException(`TaskCycle with ID ${id} not found`);
    }

    return this.prisma.taskCycle.delete({
      where: { id },
    });
  }

  /**
   * Generate task instances for a cycle
   * This creates individual or department tasks based on the template scope
   */
  async generateInstances(userId: string, cycleId: string) {
    const cycle = await this.prisma.taskCycle.findFirst({
      where: {
        id: cycleId,
        schedule: {
          template: {
            userId,
          },
        },
      },
      include: {
        schedule: {
          include: {
            template: true,
          },
        },
        instances: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException(`TaskCycle with ID ${cycleId} not found`);
    }

    // Don't generate if instances already exist
    if (cycle.instances.length > 0) {
      throw new BadRequestException('Instances already exist for this cycle');
    }

    const template = cycle.schedule.template;

    const instancesToCreate = [];

    if (template.scope === TaskScope.INDIVIDUAL) {
      // Get all active employees for this user
      const employees = await this.prisma.employee.findMany({
        where: {
          userId,
          active: true,
        },
      });

      for (const employee of employees) {
        instancesToCreate.push({
          templateId: template.id,
          cycleId: cycle.id,
          scope: TaskScope.INDIVIDUAL,
          employeeId: employee.id,
          departmentId: null,
          level: 1,
          required: true,
          title: template.title,
          description: template.description,
          target: template.defaultTarget,
          unit: template.unit,
          quantity: 0,
          status: TaskStatusV2.PENDING,
        });
      }
    } else if (template.scope === TaskScope.DEPARTMENT) {
      // Get all departments for this user
      const departments = await this.prisma.department.findMany({
        where: {
          userId,
        },
      });

      for (const department of departments) {
        instancesToCreate.push({
          templateId: template.id,
          cycleId: cycle.id,
          scope: TaskScope.DEPARTMENT,
          employeeId: null,
          departmentId: department.id,
          level: 1,
          required: true,
          title: template.title,
          description: template.description,
          target: template.defaultTarget,
          unit: template.unit,
          quantity: 0,
          status: TaskStatusV2.PENDING,
        });
      }
    }

    // Create all instances
    const createdInstances = await this.prisma.taskInstance.createMany({
      data: instancesToCreate,
    });

    return {
      cycleId: cycle.id,
      instancesCreated: createdInstances.count,
    };
  }

  /**
   * Update cycle status based on its instances
   */
  async updateCycleStatus(userId: string, cycleId: string) {
    const cycle = await this.prisma.taskCycle.findFirst({
      where: {
        id: cycleId,
        schedule: {
          template: {
            userId,
          },
        },
      },
      include: {
        instances: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException(`TaskCycle with ID ${cycleId} not found`);
    }

    if (cycle.instances.length === 0) {
      return cycle;
    }

    // Calculate status based on instances
    const allCompleted = cycle.instances.every(
      (i) =>
        i.status === TaskStatusV2.COMPLETED ||
        i.status === TaskStatusV2.APPROVED,
    );
    const anyExpired = cycle.instances.some(
      (i) => i.status === TaskStatusV2.EXPIRED,
    );

    let newStatus = cycle.status;

    if (allCompleted) {
      newStatus = TaskStatusV2.COMPLETED;
    } else if (anyExpired) {
      newStatus = TaskStatusV2.EXPIRED;
    } else if (
      cycle.instances.some((i) => i.status === TaskStatusV2.IN_PROGRESS)
    ) {
      newStatus = TaskStatusV2.IN_PROGRESS;
    }

    if (newStatus !== cycle.status) {
      return this.prisma.taskCycle.update({
        where: { id: cycleId },
        data: { status: newStatus },
      });
    }

    return cycle;
  }

  /**
   * Get cycle statistics
   */
  async getCycleStatistics(userId: string, cycleId: string) {
    const cycle = await this.prisma.taskCycle.findFirst({
      where: {
        id: cycleId,
        schedule: {
          template: {
            userId,
          },
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException(`TaskCycle with ID ${cycleId} not found`);
    }

    const [
      totalInstances,
      pendingInstances,
      inProgressInstances,
      completedInstances,
      approvedInstances,
      rejectedInstances,
      expiredInstances,
    ] = await Promise.all([
      this.prisma.taskInstance.count({ where: { cycleId } }),
      this.prisma.taskInstance.count({
        where: { cycleId, status: TaskStatusV2.PENDING },
      }),
      this.prisma.taskInstance.count({
        where: { cycleId, status: TaskStatusV2.IN_PROGRESS },
      }),
      this.prisma.taskInstance.count({
        where: { cycleId, status: TaskStatusV2.COMPLETED },
      }),
      this.prisma.taskInstance.count({
        where: { cycleId, status: TaskStatusV2.APPROVED },
      }),
      this.prisma.taskInstance.count({
        where: { cycleId, status: TaskStatusV2.REJECTED },
      }),
      this.prisma.taskInstance.count({
        where: { cycleId, status: TaskStatusV2.EXPIRED },
      }),
    ]);

    return {
      totalInstances,
      pendingInstances,
      inProgressInstances,
      completedInstances,
      approvedInstances,
      rejectedInstances,
      expiredInstances,
      completionRate:
        totalInstances > 0
          ? ((completedInstances + approvedInstances) / totalInstances) * 100
          : 0,
    };
  }
}
