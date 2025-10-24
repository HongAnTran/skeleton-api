import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTaskInstanceDto } from '../dto/task-instance/create-task-instance.dto';
import { UpdateTaskInstanceDto } from '../dto/task-instance/update-task-instance.dto';
import { CompleteTaskInstanceDto } from '../dto/task-instance/complete-task-instance.dto';
import { ApproveTaskInstanceDto } from '../dto/task-instance/approve-task-instance.dto';
import { RejectTaskInstanceDto } from '../dto/task-instance/reject-task-instance.dto';
import { UpdateProgressDto } from '../dto/task-instance/update-progress.dto';
import { QueryTaskInstanceDto } from '../dto/task-instance/query-task-instance.dto';
import { TaskStatusV2, TaskScope, Aggregation } from '@prisma/client';

@Injectable()
export class TaskInstanceService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateTaskInstanceDto) {
    // Verify template and cycle exist
    const [template, cycle] = await Promise.all([
      this.prisma.taskTemplate.findFirst({
        where: { id: createDto.templateId, userId },
      }),
      this.prisma.taskCycle.findFirst({
        where: {
          id: createDto.cycleId,
          schedule: { template: { userId } },
        },
      }),
    ]);

    if (!template) {
      throw new NotFoundException('TaskTemplate not found');
    }

    if (!cycle) {
      throw new NotFoundException('TaskCycle not found');
    }

    // Validate scope-specific fields
    if (createDto.scope === TaskScope.INDIVIDUAL && !createDto.employeeId) {
      throw new BadRequestException(
        'employeeId is required for INDIVIDUAL scope',
      );
    }

    if (createDto.scope === TaskScope.DEPARTMENT && !createDto.departmentId) {
      throw new BadRequestException(
        'departmentId is required for DEPARTMENT scope',
      );
    }

    return this.prisma.taskInstance.create({
      data: createDto,
      include: {
        template: true,
        cycle: true,
        employee: true,
        department: true,
      },
    });
  }

  async findAll(userId: string, query: QueryTaskInstanceDto) {
    const where: any = {
      template: {
        userId,
      },
    };

    if (query.cycleId) {
      where.cycleId = query.cycleId;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.scope) {
      where.scope = query.scope;
    }

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.level) {
      where.level = query.level;
    }

    return this.prisma.taskInstance.findMany({
      where,
      include: {
        template: true,
        cycle: true,
        employee: true,
        department: true,
        _count: {
          select: {
            progressEvents: true,
            approvals: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const instance = await this.prisma.taskInstance.findFirst({
      where: {
        id,
        template: {
          userId,
        },
      },
      include: {
        template: true,
        cycle: {
          include: {
            schedule: true,
          },
        },
        employee: true,
        department: true,
        progressEvents: {
          orderBy: {
            occurredAt: 'desc',
          },
        },
        approvals: {
          orderBy: {
            actedAt: 'desc',
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(`TaskInstance with ID ${id} not found`);
    }

    return instance;
  }

  async update(userId: string, id: string, updateDto: UpdateTaskInstanceDto) {
    const instance = await this.prisma.taskInstance.findFirst({
      where: {
        id,
        template: {
          userId,
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(`TaskInstance with ID ${id} not found`);
    }

    return this.prisma.taskInstance.update({
      where: { id },
      data: updateDto,
      include: {
        template: true,
        cycle: true,
        employee: true,
        department: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const instance = await this.prisma.taskInstance.findFirst({
      where: {
        id,
        template: {
          userId,
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(`TaskInstance with ID ${id} not found`);
    }

    return this.prisma.taskInstance.delete({
      where: { id },
    });
  }

  /**
   * Update progress of a task instance
   */
  async updateProgress(
    employeeId: string,
    instanceId: string,
    updateProgressDto: UpdateProgressDto,
  ) {
    const instance = await this.prisma.taskInstance.findFirst({
      where: {
        id: instanceId,
      },
    });

    if (!instance) {
      throw new NotFoundException(
        `TaskInstance with ID ${instanceId} not found`,
      );
    }

    // Calculate new quantity
    const newQuantity = instance.quantity + updateProgressDto.delta;

    if (newQuantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    // Create progress event and update instance in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create progress event
      await tx.taskProgressEvent.create({
        data: {
          instanceId: instance.id,
          delta: updateProgressDto.delta,
          source: updateProgressDto.source,
          note: updateProgressDto.note,
          occurredAt: new Date(),
          createdBy: employeeId,
        },
      });

      // Update instance quantity
      const updatedInstance = await tx.taskInstance.update({
        where: { id: instance.id },
        data: {
          quantity: newQuantity,
          // Auto-change to IN_PROGRESS if it was PENDING
          ...(instance.status === TaskStatusV2.PENDING && {
            status: TaskStatusV2.IN_PROGRESS,
          }),
        },
        include: {
          template: true,
          cycle: true,
          employee: true,
          department: true,
        },
      });

      return updatedInstance;
    });

    return result;
  }

  /**
   * Complete a task instance
   * Nhân viên tự đánh dấu hoàn thành task
   */
  async complete(
    employeeId: string,
    instanceId: string,
    completeDto: CompleteTaskInstanceDto,
  ) {
    const instance = await this.prisma.taskInstance.findFirst({
      where: {
        id: instanceId,
      },
    });

    if (!instance) {
      throw new NotFoundException(
        `TaskInstance with ID ${instanceId} not found`,
      );
    }

    if (
      instance.status !== TaskStatusV2.PENDING &&
      instance.status !== TaskStatusV2.IN_PROGRESS &&
      instance.status !== TaskStatusV2.REJECTED
    ) {
      throw new BadRequestException(
        `Cannot complete task with status ${instance.status}`,
      );
    }

    // Check if target is met (if target is set)
    if (instance.target && instance.quantity < instance.target) {
      throw new BadRequestException(
        `Task quantity (${instance.quantity}) has not reached target (${instance.target})`,
      );
    }

    // Create completion event in progress history
    await this.prisma.$transaction(async (tx) => {
      // Log completion event
      if (completeDto.note) {
        await tx.taskProgressEvent.create({
          data: {
            instanceId: instance.id,
            delta: 0,
            source: 'completion',
            note: completeDto.note,
            occurredAt: new Date(),
            createdBy: employeeId,
          },
        });
      }

      // Update task status
      await tx.taskInstance.update({
        where: { id: instanceId },
        data: {
          status: TaskStatusV2.COMPLETED,
          completedAt: new Date(),
          completedBy: employeeId,
        },
      });
    });

    // Return updated instance
    return this.prisma.taskInstance.findUnique({
      where: { id: instanceId },
      include: {
        template: true,
        cycle: true,
        employee: true,
        department: true,
      },
    });
  }

  /**
   * Approve a completed task instance
   */
  async approve(
    userId: string,
    instanceId: string,
    approveDto: ApproveTaskInstanceDto,
  ) {
    const instance = await this.prisma.taskInstance.findFirst({
      where: {
        id: instanceId,
        template: {
          userId,
        },
      },
      include: {
        template: true,
      },
    });

    if (!instance) {
      throw new NotFoundException(
        `TaskInstance with ID ${instanceId} not found`,
      );
    }

    if (instance.status !== TaskStatusV2.COMPLETED) {
      throw new BadRequestException('Only COMPLETED tasks can be approved');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create approval record
      await tx.taskApproval.create({
        data: {
          instanceId: instance.id,
          action: 'APPROVE',
          reason: approveDto.reason,
          actedBy: approveDto.approvedBy,
        },
      });

      // Update instance
      const updatedInstance = await tx.taskInstance.update({
        where: { id: instanceId },
        data: {
          status: TaskStatusV2.APPROVED,
          approvedAt: new Date(),
          approvedBy: approveDto.approvedBy,
        },
        include: {
          template: true,
          cycle: true,
          employee: true,
          department: true,
        },
      });

      // If this is a department task with aggregation, update parent level
      if (
        instance.scope === TaskScope.INDIVIDUAL &&
        instance.level > 1 &&
        instance.departmentId
      ) {
        await this.aggregateToParentLevel(
          tx,
          instance.cycleId,
          instance.departmentId,
          instance.level,
          instance.template.aggregation,
        );
      }

      return updatedInstance;
    });

    return result;
  }

  /**
   * Reject a completed task instance
   */
  async reject(
    userId: string,
    instanceId: string,
    rejectDto: RejectTaskInstanceDto,
  ) {
    const instance = await this.prisma.taskInstance.findFirst({
      where: {
        id: instanceId,
        template: {
          userId,
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(
        `TaskInstance with ID ${instanceId} not found`,
      );
    }

    if (instance.status !== TaskStatusV2.COMPLETED) {
      throw new BadRequestException('Only COMPLETED tasks can be rejected');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create approval record with REJECT action
      await tx.taskApproval.create({
        data: {
          instanceId: instance.id,
          action: 'REJECT',
          reason: rejectDto.rejectedReason,
          actedBy: rejectDto.rejectedBy,
        },
      });

      // Update instance
      return await tx.taskInstance.update({
        where: { id: instanceId },
        data: {
          status: TaskStatusV2.REJECTED,
          rejectedAt: new Date(),
          rejectedBy: rejectDto.rejectedBy,
          rejectedReason: rejectDto.rejectedReason,
        },
        include: {
          template: true,
          cycle: true,
          employee: true,
          department: true,
        },
      });
    });

    return result;
  }

  /**
   * Mark expired tasks
   */
  async markExpired(userId: string, cycleId: string) {
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

    const now = new Date();

    // Mark tasks as expired if cycle period has ended and they're not completed/approved
    if (now > cycle.periodEnd) {
      const result = await this.prisma.taskInstance.updateMany({
        where: {
          cycleId,
          status: {
            in: [
              TaskStatusV2.PENDING,
              TaskStatusV2.IN_PROGRESS,
              TaskStatusV2.REJECTED,
            ],
          },
        },
        data: {
          status: TaskStatusV2.EXPIRED,
        },
      });

      return {
        expiredCount: result.count,
      };
    }

    return {
      expiredCount: 0,
    };
  }

  /**
   * Aggregate child level tasks to parent level (for hierarchical approval)
   */
  private async aggregateToParentLevel(
    tx: any,
    cycleId: string,
    departmentId: string,
    childLevel: number,
    aggregation: Aggregation,
  ) {
    const parentLevel = childLevel + 1;

    // Get all child tasks at this level for this department
    const childTasks = await tx.taskInstance.findMany({
      where: {
        cycleId,
        departmentId,
        level: childLevel,
        status: TaskStatusV2.APPROVED,
      },
    });

    if (childTasks.length === 0) return;

    // Find or create parent task
    let parentTask = await tx.taskInstance.findFirst({
      where: {
        cycleId,
        departmentId,
        level: parentLevel,
        scope: TaskScope.DEPARTMENT,
      },
    });

    // Calculate aggregated value
    let aggregatedValue = 0;

    switch (aggregation) {
      case Aggregation.SUM:
        aggregatedValue = childTasks.reduce(
          (sum, task) => sum + task.quantity,
          0,
        );
        break;
      case Aggregation.AVERAGE:
        aggregatedValue =
          childTasks.reduce((sum, task) => sum + task.quantity, 0) /
          childTasks.length;
        break;
      case Aggregation.MAX:
        aggregatedValue = Math.max(...childTasks.map((task) => task.quantity));
        break;
      case Aggregation.MIN:
        aggregatedValue = Math.min(...childTasks.map((task) => task.quantity));
        break;
      case Aggregation.COUNT:
        aggregatedValue = childTasks.length;
        break;
    }

    if (parentTask) {
      // Update existing parent task
      await tx.taskInstance.update({
        where: { id: parentTask.id },
        data: {
          quantity: aggregatedValue,
        },
      });
    }
  }

  /**
   * Get task instance statistics
   */
  async getStatistics(userId: string, query: QueryTaskInstanceDto) {
    const where: any = {
      template: {
        userId,
      },
    };

    if (query.cycleId) where.cycleId = query.cycleId;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.departmentId) where.departmentId = query.departmentId;

    const [total, pending, inProgress, completed, approved, rejected, expired] =
      await Promise.all([
        this.prisma.taskInstance.count({ where }),
        this.prisma.taskInstance.count({
          where: { ...where, status: TaskStatusV2.PENDING },
        }),
        this.prisma.taskInstance.count({
          where: { ...where, status: TaskStatusV2.IN_PROGRESS },
        }),
        this.prisma.taskInstance.count({
          where: { ...where, status: TaskStatusV2.COMPLETED },
        }),
        this.prisma.taskInstance.count({
          where: { ...where, status: TaskStatusV2.APPROVED },
        }),
        this.prisma.taskInstance.count({
          where: { ...where, status: TaskStatusV2.REJECTED },
        }),
        this.prisma.taskInstance.count({
          where: { ...where, status: TaskStatusV2.EXPIRED },
        }),
      ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      approved,
      rejected,
      expired,
      completionRate: total > 0 ? ((completed + approved) / total) * 100 : 0,
    };
  }
}
