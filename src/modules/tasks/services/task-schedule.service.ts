import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTaskScheduleDto } from '../dto/task-schedule/create-task-schedule.dto';
import { UpdateTaskScheduleDto } from '../dto/task-schedule/update-task-schedule.dto';
import { QueryTaskScheduleDto } from '../dto/task-schedule/query-task-schedule.dto';
import { Frequency } from '@prisma/client';

@Injectable()
export class TaskScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateTaskScheduleDto) {
    // Verify template exists and belongs to user
    const template = await this.prisma.taskTemplate.findFirst({
      where: { id: createDto.templateId, userId },
    });

    if (!template) {
      throw new NotFoundException('TaskTemplate not found');
    }

    const schedule = await this.prisma.taskSchedule.create({
      data: {
        ...createDto,
        startDate: new Date(createDto.startDate),
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      },
      include: {
        template: true,
      },
    });

    return schedule;
  }

  async findAll(userId: string, query: QueryTaskScheduleDto) {
    const where: any = {
      template: {
        userId,
      },
    };

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.frequency) {
      where.frequency = query.frequency;
    }

    return this.prisma.taskSchedule.findMany({
      where,
      include: {
        template: true,
        cycles: {
          take: 5,
          orderBy: {
            periodStart: 'desc',
          },
        },
        _count: {
          select: {
            cycles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const schedule = await this.prisma.taskSchedule.findFirst({
      where: {
        id,
        template: {
          userId,
        },
      },
      include: {
        template: true,
        cycles: {
          orderBy: {
            periodStart: 'desc',
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`TaskSchedule with ID ${id} not found`);
    }

    return schedule;
  }

  async update(userId: string, id: string, updateDto: UpdateTaskScheduleDto) {
    const schedule = await this.prisma.taskSchedule.findFirst({
      where: {
        id,
        template: {
          userId,
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`TaskSchedule with ID ${id} not found`);
    }

    const updateData: any = { ...updateDto };
    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate) {
      updateData.endDate = new Date(updateDto.endDate);
    }

    return this.prisma.taskSchedule.update({
      where: { id },
      data: updateData,
      include: {
        template: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const schedule = await this.prisma.taskSchedule.findFirst({
      where: {
        id,
        template: {
          userId,
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`TaskSchedule with ID ${id} not found`);
    }

    return this.prisma.taskSchedule.delete({
      where: { id },
    });
  }

  /**
   * Generate cycles for a schedule based on startDate and endDate
   * Simple: Generate ALL cycles between startDate and endDate
   *
   * Example:
   *   - MONTHLY schedule from 2025-11-01 to 2025-12-31
   *   - Will create 2 cycles: Nov (11/1-11/30) and Dec (12/1-12/31)
   */
  async generateCycles(userId: string, scheduleId: string) {
    const schedule = await this.prisma.taskSchedule.findFirst({
      where: {
        id: scheduleId,
        template: {
          userId,
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(
        `TaskSchedule with ID ${scheduleId} not found`,
      );
    }

    if (!schedule.endDate) {
      throw new BadRequestException(
        'Schedule must have an endDate to generate cycles',
      );
    }

    const cyclesToCreate: Array<{
      scheduleId: string;
      periodStart: Date;
      periodEnd: Date;
    }> = [];

    let currentStart = new Date(schedule.startDate);

    // Generate all cycles from startDate to endDate
    while (currentStart <= schedule.endDate) {
      const currentEnd = this.calculatePeriodEnd(
        currentStart,
        schedule.frequency,
        schedule.interval,
        schedule.dayOfMonth,
      );

      // If period end exceeds schedule endDate, adjust it
      const finalEnd =
        currentEnd > schedule.endDate ? schedule.endDate : currentEnd;

      cyclesToCreate.push({
        scheduleId: schedule.id,
        periodStart: new Date(currentStart),
        periodEnd: finalEnd,
      });

      // Move to next period
      currentStart = new Date(currentEnd);
      currentStart.setMilliseconds(currentStart.getMilliseconds() + 1);

      // Stop if we've passed the endDate
      if (currentStart > schedule.endDate) {
        break;
      }
    }

    // Create cycles in database
    const createdCycles = [];
    for (const cycleData of cyclesToCreate) {
      try {
        const cycle = await this.prisma.taskCycle.create({
          data: cycleData,
        });
        createdCycles.push(cycle);
      } catch (error) {
        // Skip if already exists (unique constraint)
        console.log('Cycle already exists, skipping:', cycleData);
      }
    }

    return createdCycles;
  }

  /**
   * Calculate the end date of a period based on frequency
   */
  private calculatePeriodEnd(
    start: Date,
    frequency: Frequency,
    interval: number,
    dayOfMonth?: number | null,
  ): Date {
    const end = new Date(start);

    switch (frequency) {
      case Frequency.DAILY:
        end.setDate(end.getDate() + interval);
        break;

      case Frequency.WEEKLY:
        end.setDate(end.getDate() + 7 * interval);
        break;

      case Frequency.MONTHLY:
        end.setMonth(end.getMonth() + interval);
        break;

      case Frequency.QUARTERLY:
        end.setMonth(end.getMonth() + 3 * interval);
        break;

      case Frequency.YEARLY:
        end.setFullYear(end.getFullYear() + interval);
        break;

      case Frequency.NONE:
        // For NONE, the cycle never ends (or ends at schedule end date)
        end.setFullYear(end.getFullYear() + 100);
        break;
    }

    // Subtract 1 millisecond to make it the last moment of the period
    end.setMilliseconds(end.getMilliseconds() - 1);

    return end;
  }

  /**
   * Generate cycles for all active schedules that have endDate
   */
  async generateAllActiveCycles(userId: string) {
    const activeSchedules = await this.prisma.taskSchedule.findMany({
      where: {
        template: {
          userId,
          isActive: true,
        },
        endDate: {
          not: null, // Only schedules with endDate
        },
      },
      include: {
        template: true,
      },
    });

    const results = [];
    for (const schedule of activeSchedules) {
      try {
        const cycles = await this.generateCycles(userId, schedule.id);
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.template.title,
          cyclesCreated: cycles.length,
          success: true,
        });
      } catch (error) {
        results.push({
          scheduleId: schedule.id,
          cyclesCreated: 0,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}
