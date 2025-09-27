import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    return this.prisma.task.create({
      data: createTaskDto,
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.task.findMany({
      skip,
      take,
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async findByEmployeeId(employeeId: string, skip?: number, take?: number) {
    return this.prisma.task.findMany({
      where: { employeeId },
      skip,
      take,
    });
  }

  async findByStatus(status: TaskStatus, skip?: number, take?: number) {
    return this.prisma.task.findMany({
      where: { status },
      skip,
      take,
    });
  }

  async findByLevel(level: number, skip?: number, take?: number) {
    return this.prisma.task.findMany({
      where: { level },
      skip,
      take,
    });
  }

  async updateStatus(id: string, updateTaskStatusDto: UpdateTaskStatusDto) {
    try {
      return await this.prisma.task.update({
        where: { id },
        data: { status: updateTaskStatusDto.status },
      });
    } catch (error) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    try {
      return await this.prisma.task.update({
        where: { id },
        data: updateTaskDto,
      });
    } catch (error) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.task.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async count(employeeId?: string, status?: TaskStatus, level?: number) {
    return this.prisma.task.count({
      where: {
        ...(employeeId && { employeeId }),
        ...(status && { status }),
        ...(level && { level }),
      },
    });
  }

  async getTaskStatistics(employeeId?: string) {
    const where = employeeId ? { employeeId } : {};

    const [total, pending, done] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({
        where: { ...where, status: TaskStatus.PENDING },
      }),
      this.prisma.task.count({ where: { ...where, status: TaskStatus.DONE } }),
    ]);

    return {
      total,
      pending,
      done,
      completionRate: total > 0 ? (done / total) * 100 : 0,
    };
  }
}
