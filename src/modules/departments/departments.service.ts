import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: createDepartmentDto,
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.department.findMany({
      skip,
      take,
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async findByUserId(userId: string, skip?: number, take?: number) {
    return this.prisma.department.findMany({
      where: { userId },
      skip,
      take,
    });
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    try {
      return await this.prisma.department.update({
        where: { id },
        data: updateDepartmentDto,
      });
    } catch (error) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.department.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
  }

  async count(userId?: string) {
    return this.prisma.department.count({
      where: userId ? { userId } : undefined,
    });
  }
}
