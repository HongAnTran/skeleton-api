import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSlotDto } from './dto/create-shift-slot.dto';
import { UpdateShiftSlotDto } from './dto/update-shift-slot.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftSlotsService {
  constructor(private prisma: PrismaService) {}

  async create(createShiftSlotDto: CreateShiftSlotDto) {
    return this.prisma.shiftSlot.create({
      data: {
        ...createShiftSlotDto,
        startDate: new Date(createShiftSlotDto.startDate),
        endDate: new Date(createShiftSlotDto.endDate),
        date: new Date(createShiftSlotDto.date),
      },
    });
  }

  async findAll(
    where: Prisma.ShiftSlotWhereInput,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.shiftSlot.findMany({
      where,
      skip,
      take,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        branch: true,
        signups: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            signups: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const shiftSlot = await this.prisma.shiftSlot.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        branch: true,
        signups: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shiftSlot) {
      throw new NotFoundException(`Shift slot with ID ${id} not found`);
    }

    return shiftSlot;
  }

  async update(id: string, updateShiftSlotDto: UpdateShiftSlotDto) {
    try {
      const updateData = { ...updateShiftSlotDto } as any;
      if (updateShiftSlotDto.startDate) {
        updateData.startDate = new Date(updateShiftSlotDto.startDate);
      }
      if (updateShiftSlotDto.endDate) {
        updateData.endDate = new Date(updateShiftSlotDto.endDate);
      }
      if (updateShiftSlotDto.date) {
        updateData.date = new Date(updateShiftSlotDto.date);
      }

      return await this.prisma.shiftSlot.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          branch: true,
          signups: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Shift slot with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.shiftSlot.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Shift slot with ID ${id} not found`);
    }
  }

  async count(where: Prisma.ShiftSlotWhereInput) {
    return this.prisma.shiftSlot.count({
      where,
    });
  }
}
