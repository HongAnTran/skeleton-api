import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTaskDto } from '../dto/task-instance/create-task.dto';
import { UpdateTaskInstanceDto } from '../dto/task-instance/update-task-instance.dto';
import { QueryTaskDto } from '../dto/task-instance/query-task.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateTaskDto) {
    const { departmentId, ...rest } = createDto;
    return this.prisma.taskV2.create({
      data: {
        ...rest,
        departmentId,
        userId,
      },
    });
  }
  async findAll(userId: string, query: QueryTaskDto) {
    const where: Prisma.TaskV2WhereInput = {
      userId,
    };

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.level) {
      where.level = query.level;
    }

    return this.prisma.taskV2.findMany({
      where,
      include: {
        cycles: true,
        department: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllByEmployee(userId: string, employeeId: string) {
    return this.prisma.taskV2.findMany({
      where: {
        userId,
      },
      include: {
        cycles: true,
        department: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const instance = await this.prisma.taskV2.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        cycles: true,
        department: true,
      },
    });

    if (!instance) {
      throw new NotFoundException(`TaskInstance with ID ${id} not found`);
    }

    return instance;
  }

  async update(userId: string, id: string, updateDto: UpdateTaskInstanceDto) {
    const instance = await this.prisma.taskV2.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!instance) {
      throw new NotFoundException(`TaskInstance with ID ${id} not found`);
    }

    return this.prisma.taskV2.update({
      where: { id },
      data: updateDto,
      include: {
        cycles: true,
        department: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const instance = await this.prisma.taskV2.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!instance) {
      throw new NotFoundException(`TaskInstance with ID ${id} not found`);
    }

    return this.prisma.taskV2.delete({
      where: { id },
    });
  }
}
