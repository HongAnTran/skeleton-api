import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTaskCycleDto } from '../dto/task-cycle/create-task-cycle.dto';
import { UpdateTaskCycleDto } from '../dto/task-cycle/update-task-cycle.dto';
import { QueryTaskCycleDto } from '../dto/task-cycle/query-task-cycle.dto';
import { Prisma } from '@prisma/client';
import { CreateTaskCycleAllDto } from '../dto/task-cycle/create-task-cycle-all.dto';
import { TaskAssignmentService } from './task-assignment.service';

@Injectable()
export class TaskCycleService {
  constructor(
    private prisma: PrismaService,
    private taskAssignmentService: TaskAssignmentService,
  ) {}

  async create(userId: string, createDto: CreateTaskCycleDto) {
    const task = await this.prisma.taskV2.findFirst({
      where: {
        id: createDto.taskId,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const cycle = await this.prisma.taskCycleV2.create({
      data: {
        ...createDto,
        periodStart: new Date(createDto.periodStart),
        periodEnd: new Date(createDto.periodEnd),
      },
      include: {
        task: true,
      },
    });
    return cycle;
  }

  async findAll(userId: string, query: QueryTaskCycleDto) {
    const where: Prisma.TaskCycleV2WhereInput = {
      task: {
        userId,
      },
    };

    if (query.taskId) {
      where.taskId = query.taskId;
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

    return this.prisma.taskCycleV2.findMany({
      where,
      include: {
        task: true,
        assignments: true,
      },
      orderBy: {
        periodStart: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const cycle = await this.prisma.taskCycleV2.findFirst({
      where: {
        id,
        task: {
          userId,
        },
      },
      include: {
        task: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException(`TaskCycle with ID ${id} not found`);
    }

    return cycle;
  }

  async update(userId: string, id: string, updateDto: UpdateTaskCycleDto) {
    const cycle = await this.prisma.taskCycleV2.findFirst({
      where: {
        id,
        task: {
          userId,
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException(`Không tìm thấy cycle`);
    }

    return this.prisma.taskCycleV2.update({
      where: { id },
      data: {
        periodStart: updateDto.periodStart
          ? new Date(updateDto.periodStart)
          : undefined,
        periodEnd: updateDto.periodEnd
          ? new Date(updateDto.periodEnd)
          : undefined,
      },
      include: {
        task: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const cycle = await this.prisma.taskCycleV2.findFirst({
      where: {
        id,
        task: {
          userId,
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException(`TaskCycle with ID ${id} not found`);
    }

    return this.prisma.taskCycleV2.delete({
      where: { id },
    });
  }

  async createManyForAllTask(userId: string, createDto: CreateTaskCycleAllDto) {
    const tasks = await this.prisma.taskV2.findMany({
      where: {
        userId,
        isActive: true,
      },
    });
    const baseDate = new Date(createDto.periodStart);
    const baseYear = baseDate.getFullYear();
    const baseMonth = baseDate.getMonth();

    const allCycles: Awaited<
      ReturnType<typeof this.prisma.taskCycleV2.create>
    >[] = [];

    for (const task of tasks) {
      for (let i = 0; i < 12; i++) {
        const periodStart = new Date(baseYear, baseMonth + i, 1);
        const periodEnd = new Date(
          baseYear,
          baseMonth + i + 1,
          0,
          23,
          59,
          59,
          999,
        );

        const cycle = await this.prisma.taskCycleV2.create({
          data: {
            taskId: task.id,
            periodStart,
            periodEnd,
          },
        });
        allCycles.push(cycle);
        await this.taskAssignmentService.assignEmployeesToCycle(userId, {
          cycleId: cycle.id,
        });
      }
    }

    return allCycles;
  }

  async create12CyclesForTask(
    userId: string,
    taskId: string,
    periodStart?: Date,
  ) {
    const baseDate = periodStart ?? new Date();
    const baseYear = baseDate.getFullYear();
    const baseMonth = baseDate.getMonth();

    const cycles = [];
    for (let i = 0; i < 12; i++) {
      const periodStartDate = new Date(baseYear, baseMonth + i, 1);
      const periodEndDate = new Date(
        baseYear,
        baseMonth + i + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const cycle = await this.prisma.taskCycleV2.create({
        data: {
          taskId,
          periodStart: periodStartDate,
          periodEnd: periodEndDate,
        },
      });
      cycles.push(cycle);
      await this.taskAssignmentService.assignEmployeesToCycle(userId, {
        cycleId: cycle.id,
      });
    }
    return cycles;
  }
}
