import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: createBranchDto,
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.branch.findMany({
      skip,
      take,
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  async findByUserId(userId: string, skip?: number, take?: number) {
    return this.prisma.branch.findMany({
      where: { userId },
      skip,
      take,
      include: {
        employees: true,
        shiftSlots: true,
        _count: {
          select: {
            employees: true,
            shiftSlots: true,
          },
        },
      },
    });
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    try {
      return await this.prisma.branch.update({
        where: { id },
        data: updateBranchDto,
      });
    } catch (error) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.branch.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
  }

  async count(userId?: string) {
    return this.prisma.branch.count({
      where: userId ? { userId } : undefined,
    });
  }
}
