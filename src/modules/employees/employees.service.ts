import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PasswordUtil } from 'src/common/utils/password.util';
import { Prisma } from '@prisma/client';
import { EmployeeShiftSummaryResponse } from './dto/employee-shift-summary.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createEmployeeDto: CreateEmployeeDto) {
    const { password, provider, email, username, ...employeeData } =
      createEmployeeDto;

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
      include: {
        account: {
          select: {
            id: true,
            email: true,
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

    const totalHours = shiftSignups.reduce(
      (sum, signup) => sum + signup.totalHours,
      0,
    );
    const shiftCount = shiftSignups.length;

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
      totalHours,
      shiftCount,
      shifts,
    };
  }
}
