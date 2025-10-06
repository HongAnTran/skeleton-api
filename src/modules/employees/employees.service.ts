import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PasswordUtil } from 'src/common/utils/password.util';
import { Prisma, ShiftSignupStatus } from '@prisma/client';
import { EmployeeShiftSummaryResponse } from './dto/employee-shift-summary.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createEmployeeDto: CreateEmployeeDto) {
    const { password, provider, email, username, ...employeeData } =
      createEmployeeDto;

    const [account, usernameAccount] = await Promise.all([
      this.prisma.account.findUnique({
        where: {
          email: email,
        },
      }),
      this.prisma.account.findUnique({
        where: {
          username: username,
        },
      }),
    ]);

    if (account) {
      throw new BadRequestException('Email đã tồn tại');
    }
    if (usernameAccount) {
      throw new BadRequestException('Username đã tồn tại');
    }

    return this.prisma.employee.create({
      data: {
        userId,
        ...employeeData,
        account: {
          create: {
            username: username,
            email: email,
            passwordHash: await PasswordUtil.hash(password),
            provider: provider || 'local',
            role: 'EMPLOYEE',
          },
        },
      },
    });
  }

  async findAll(
    where: Prisma.EmployeeWhereInput,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        shiftSignups: {
          include: {
            slot: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: true,
        shiftSignups: {
          include: {
            slot: true,
          },
        },
        tasks: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async findByUserId(userId: string) {
    return this.prisma.employee.findMany({
      where: { userId },
      include: {
        branch: true,
        shiftSignups: true,
        tasks: true,
      },
    });
  }

  async findByBranchId(branchId: string, skip?: number, take?: number) {
    return this.prisma.employee.findMany({
      where: { branchId },
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: true,
        tasks: true,
      },
    });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    try {
      const { password, provider, email, ...employeeData } = updateEmployeeDto;
      return await this.prisma.employee.update({
        where: { id },
        data: {
          ...employeeData,
          account: {
            update: {
              email: email || undefined,
              passwordHash: password
                ? await PasswordUtil.hash(password)
                : undefined,
              provider: provider || undefined,
            },
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.employee.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
  }

  async count(where: Prisma.EmployeeWhereInput) {
    return this.prisma.employee.count({
      where,
    });
  }

  async getEmployeeShiftSummary(
    employeeId: string,
    startDate: string,
    endDate: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        branch: true,
        department: true,
        account: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const shiftSignups = await this.prisma.shiftSignup.findMany({
      where: {
        employeeId,
        slot: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
      include: {
        slot: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            type: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        slot: {
          date: 'asc',
        },
      },
    });

    const ShiftSignupsCancelled = shiftSignups.filter(
      (signup) => signup.status === ShiftSignupStatus.CANCELLED,
    );
    const ShiftSignupsCompleted = shiftSignups.filter(
      (signup) => signup.status === ShiftSignupStatus.COMPLETED,
    );

    const ShiftSignupsPending = shiftSignups.filter(
      (signup) => signup.status === ShiftSignupStatus.PENDING,
    );

    const totalHoursCompleted = ShiftSignupsCompleted.reduce(
      (sum, signup) => sum + signup.totalHours,
      0,
    );
    const shiftCountCompleted = ShiftSignupsCompleted.length;
    const shiftCountCancelled = ShiftSignupsCancelled.length;
    const shiftCountPending = ShiftSignupsPending.length;

    const shifts = shiftSignups.map((signup) => ({
      id: signup.id,
      employeeId: signup.employeeId,
      slotId: signup.slotId,
      status: signup.status,
      totalHours: signup.totalHours,
      createdAt: signup.createdAt,
      updatedAt: signup.updatedAt,
      slot: {
        id: signup.slot.id,
        date: signup.slot.date,
        capacity: signup.slot.capacity,
        note: signup.slot.note,
        branch: signup.slot.branch,
        department: signup.slot.department,
        type: signup.slot.type,
      },
    }));

    return {
      employee: employee,
      shiftCountPending,
      totalHoursCompleted,
      shiftCountCompleted,
      shiftCountCancelled,
      shifts,
    };
  }
}
