import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PasswordUtil } from 'src/common/utils/password.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createEmployeeDto: CreateEmployeeDto) {
    const { password, provider, email, ...employeeData } = createEmployeeDto;
    return this.prisma.employee.create({
      data: {
        userId,
        ...employeeData,
        account: {
          create: {
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
}
