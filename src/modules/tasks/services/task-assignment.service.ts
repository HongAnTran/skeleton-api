import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, TaskStatusV2 } from '@prisma/client';
import {
  CreateTaskAssignmentDto,
  AssignEmployeesToCycleDto,
  RejectAssignmentDto,
  QueryAssignmentDto,
} from '../dto';
import { CompleteAssignmentDto } from 'src/modules/tasks/dto/task-assignment/complete-assignment.dto';
import { DateUtil } from 'src/common/utils/date.util';

@Injectable()
export class TaskAssignmentService {
  constructor(private prisma: PrismaService) {}

  // ==================== CRUD OPERATIONS ====================

  /**
   * Tạo 1 assignment mới (gán 1 nhân viên vào 1 cycle)
   */
  async create(userId: string, createDto: CreateTaskAssignmentDto) {
    // Kiểm tra cycle có tồn tại và thuộc về user này không
    const cycle = await this.prisma.taskCycleV2.findFirst({
      where: {
        id: createDto.cycleId,
        task: {
          userId,
        },
      },
    });

    if (!cycle) {
      throw new NotFoundException('TaskCycle not found');
    }

    // Kiểm tra employee có tồn tại không
    const employee = await this.prisma.employee.findUnique({
      where: { id: createDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Kiểm tra assignment đã tồn tại chưa
    const existingAssignment = await this.prisma.taskAssignment.findUnique({
      where: {
        cycleId_employeeId: {
          cycleId: createDto.cycleId,
          employeeId: createDto.employeeId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        'This employee is already assigned to this cycle',
      );
    }

    return this.prisma.taskAssignment.create({
      data: {
        cycleId: createDto.cycleId,
        employeeId: createDto.employeeId,
        status: createDto.status ?? TaskStatusV2.PENDING,
      },
      include: {
        cycle: {
          include: {
            task: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
          },
        },
      },
    });
  }

  /**
   * Lấy danh sách assignments theo filter
   */
  async findAll(userId: string, query: QueryAssignmentDto) {
    const where: Prisma.TaskAssignmentWhereInput = {
      cycle: {
        task: {
          userId,
        },
      },
    };

    if (query.cycleId) {
      where.cycleId = query.cycleId;
    }

    if (query.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.departmentId) {
      where.employee = {
        departmentId: query.departmentId,
      };
    }

    return this.prisma.taskAssignment.findMany({
      where,
      include: {
        cycle: {
          include: {
            task: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Lấy chi tiết 1 assignment
   */
  async findOne(userId: string, id: string) {
    const assignment = await this.prisma.taskAssignment.findFirst({
      where: {
        id,
        cycle: {
          task: {
            userId,
          },
        },
      },
      include: {
        cycle: {
          include: {
            task: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`TaskAssignment with ID ${id} not found`);
    }

    return assignment;
  }

  /**
   * Xóa 1 assignment
   */
  async remove(userId: string, id: string) {
    const assignment = await this.findOne(userId, id);

    return this.prisma.taskAssignment.delete({
      where: { id: assignment.id },
    });
  }

  // ==================== BULK ASSIGNMENT OPERATIONS ====================

  /**
   * Gán nhiều nhân viên vào 1 cycle cùng lúc
   * Có thể gán theo:
   * - Danh sách employeeIds cụ thể
   * - Hoặc tất cả nhân viên trong 1 phòng ban (departmentId)
   */
  async assignEmployeesToCycle(
    userId: string,
    assignDto: AssignEmployeesToCycleDto,
  ) {
    // Kiểm tra cycle có tồn tại không
    const cycle = await this.prisma.taskCycleV2.findFirst({
      where: {
        id: assignDto.cycleId,
        task: {
          userId,
        },
      },
      include: {
        task: true,
      },
    });

    if (!cycle) {
      throw new NotFoundException('TaskCycle not found');
    }

    let employeeIds: string[] = [];

    // Option 1: Gán theo danh sách employeeIds
    if (assignDto.employeeIds && assignDto.employeeIds.length > 0) {
      employeeIds = assignDto.employeeIds;
    }
    // Option 2: Gán tất cả nhân viên trong phòng ban
    else if (assignDto.departmentId) {
      const employees = await this.prisma.employee.findMany({
        where: {
          departmentId: assignDto.departmentId,
          active: true,
        },
        select: { id: true },
      });

      if (employees.length === 0) {
        throw new BadRequestException(
          'No active employees found in this department',
        );
      }

      employeeIds = employees.map((emp) => emp.id);
    } else {
      // option 3 : gán tự động
      const employees = await this.prisma.employee.findMany({
        where: {
          departmentId: cycle.task.departmentId,
          active: true,
        },
        select: { id: true },
      });
      employeeIds = employees.map((emp) => emp.id);
    }

    // Lọc ra những nhân viên chưa được gán
    const existingAssignments = await this.prisma.taskAssignment.findMany({
      where: {
        cycleId: assignDto.cycleId,
        employeeId: {
          in: employeeIds,
        },
      },
      select: { employeeId: true },
    });

    const existingEmployeeIds = new Set(
      existingAssignments.map((a) => a.employeeId),
    );
    const newEmployeeIds = employeeIds.filter(
      (id) => !existingEmployeeIds.has(id),
    );

    if (newEmployeeIds.length === 0) {
      throw new ConflictException('All employees are already assigned');
    }

    // Tạo assignments hàng loạt
    const assignments = await this.prisma.$transaction(
      newEmployeeIds.map((employeeId) =>
        this.prisma.taskAssignment.create({
          data: {
            cycleId: assignDto.cycleId,
            employeeId,
            status: TaskStatusV2.PENDING,
          },
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                departmentId: true,
              },
            },
          },
        }),
      ),
    );

    return {
      cycleId: assignDto.cycleId,
      task: cycle.task,
      period: {
        start: cycle.periodStart,
        end: cycle.periodEnd,
      },
      assignedCount: assignments.length,
      skippedCount: existingEmployeeIds.size,
      assignments,
    };
  }

  /**
   * Gán nhanh tất cả nhân viên trong phòng ban vào 1 cycle
   * (Helper method - wrapper cho assignEmployeesToCycle)
   */
  async assignDepartmentToCycle(
    userId: string,
    cycleId: string,
    departmentId: string,
  ) {
    return this.assignEmployeesToCycle(userId, {
      cycleId,
      departmentId,
    });
  }

  // ==================== STATUS OPERATIONS ====================

  /**
   * Nhân viên đánh dấu hoàn thành
   * Status: PENDING/IN_PROGRESS/REJECTED → COMPLETED
   */
  async complete(
    userId: string,
    assignmentId: string,
    employeeId: string,
    completeDto: CompleteAssignmentDto,
  ) {
    const assignment = await this.findOne(userId, assignmentId);

    if (assignment.employeeId !== employeeId) {
      throw new BadRequestException(
        'You can only complete your own assignments',
      );
    }

    // Validate status
    if (
      assignment.status !== TaskStatusV2.IN_PROGRESS &&
      assignment.status !== TaskStatusV2.PENDING &&
      assignment.status !== TaskStatusV2.REJECTED
    ) {
      throw new BadRequestException(`bạn không thể hoàn thành assignment này`);
    }

    const startDate = assignment.cycle.periodStart;
    if (DateUtil.isFuture(startDate)) {
      throw new BadRequestException(
        `Bạn không thể hoàn thành assignment này vì chưa đến thời gian`,
      );
    }

    return this.prisma.taskAssignment.update({
      where: { id: assignment.id },
      data: {
        status: TaskStatusV2.COMPLETED,
        completedAt: new Date(),
        completedBy: employeeId,
        completedNote: completeDto.completedNote,
      },
      include: {
        cycle: {
          include: {
            task: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
          },
        },
      },
    });
  }

  /**
   * Manager phê duyệt
   * Status: COMPLETED → APPROVED
   */
  async approve(userId: string, assignmentId: string) {
    const assignment = await this.findOne(userId, assignmentId);

    // Validate status - chỉ approve được khi COMPLETED
    if (assignment.status !== TaskStatusV2.COMPLETED) {
      throw new BadRequestException(
        'Can only approve assignments with COMPLETED status',
      );
    }

    return this.prisma.taskAssignment.update({
      where: { id: assignment.id },
      data: {
        status: TaskStatusV2.APPROVED,
        approvedAt: new Date(),
        approvedBy: userId,
        rejectedAt: null,
        rejectedBy: null,
        rejectedReason: null,
      },
      include: {
        cycle: {
          include: {
            task: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
          },
        },
      },
    });
  }

  /**
   * Manager từ chối
   * Status: COMPLETED → REJECTED
   */
  async reject(
    userId: string,
    assignmentId: string,
    rejectDto: RejectAssignmentDto,
  ) {
    const assignment = await this.findOne(userId, assignmentId);

    // Validate status - chỉ reject được khi COMPLETED
    if (assignment.status !== TaskStatusV2.COMPLETED) {
      throw new BadRequestException(
        'Can only reject assignments with COMPLETED status',
      );
    }

    return this.prisma.taskAssignment.update({
      where: { id: assignment.id },
      data: {
        status: TaskStatusV2.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: userId,
        rejectedReason: rejectDto.rejectedReason,
        approvedAt: null,
        approvedBy: null,
      },
      include: {
        cycle: {
          include: {
            task: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
          },
        },
      },
    });
  }

  // ==================== REPORTING & STATISTICS ====================

  /**
   * Lấy danh sách assignments chờ duyệt
   */
  async getPendingApprovals(userId: string, departmentId?: string) {
    const where: Prisma.TaskAssignmentWhereInput = {
      cycle: {
        task: {
          userId,
        },
      },
      status: TaskStatusV2.COMPLETED,
    };

    if (departmentId) {
      where.employee = {
        departmentId,
      };
    }

    return this.prisma.taskAssignment.findMany({
      where,
      include: {
        cycle: {
          include: {
            task: true,
          },
        },
        employee: {
          select: {
            id: true,
            name: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'asc', // Ưu tiên tasks hoàn thành sớm nhất
      },
    });
  }

  /**
   * Lấy assignments của 1 nhân viên
   */
  async getEmployeeAssignments(
    userId: string,
    employeeId: string,
    status?: TaskStatusV2,
  ) {
    const where: Prisma.TaskAssignmentWhereInput = {
      cycle: {
        task: {
          userId,
        },
      },
      employeeId,
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.taskAssignment.findMany({
      where,
      include: {
        cycle: {
          include: {
            task: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
