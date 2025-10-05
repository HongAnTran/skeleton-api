import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSlotTypeDto } from './dto/create-shift-slot-type.dto';
import { UpdateShiftSlotTypeDto } from './dto/update-shift-slot-type.dto';

@Injectable()
export class ShiftSlotTypesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createShiftSlotTypeDto: CreateShiftSlotTypeDto) {
    return this.prisma.shiftSlotType.create({
      data: {
        ...createShiftSlotTypeDto,
        userId,
        startDate: new Date(createShiftSlotTypeDto.startDate),
        endDate: new Date(createShiftSlotTypeDto.endDate),
      },
    });
  }

  async findAll(userId: string, skip?: number, take?: number) {
    return this.prisma.shiftSlotType.findMany({
      skip,
      take,
      where: { userId, isDeleted: false },
      include: {
        user: true,
        shiftSlots: true,
      },
    });
  }

  async findOne(id: string) {
    const shiftSlotType = await this.prisma.shiftSlotType.findUnique({
      where: { id, isDeleted: false },
      include: {
        user: true,
        shiftSlots: true,
      },
    });

    if (!shiftSlotType) {
      throw new NotFoundException(`ShiftSlotType with ID ${id} not found`);
    }

    return shiftSlotType;
  }

  async findByUserId(userId: string, skip?: number, take?: number) {
    return this.prisma.shiftSlotType.findMany({
      where: { userId, isDeleted: false },
      skip,
      take,
      include: {
        user: true,
        shiftSlots: true,
      },
    });
  }

  async update(id: string, updateShiftSlotTypeDto: UpdateShiftSlotTypeDto) {
    try {
      const data = {
        ...updateShiftSlotTypeDto,
        ...(updateShiftSlotTypeDto.startDate && {
          startDate: new Date(updateShiftSlotTypeDto.startDate),
        }),
        ...(updateShiftSlotTypeDto.endDate && {
          endDate: new Date(updateShiftSlotTypeDto.endDate),
        }),
      };

      return await this.prisma.shiftSlotType.update({
        where: { id, isDeleted: false },
        data,
        include: {
          user: true,
          shiftSlots: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`ShiftSlotType with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    const shiftSlotType = await this.prisma.shiftSlotType.findUnique({
      where: { id },
      include: {
        shiftSlots: true,
      },
    });
    if (!shiftSlotType) {
      throw new NotFoundException(`ShiftSlotType with ID ${id} not found`);
    }

    if (shiftSlotType.isDeleted) {
      throw new BadRequestException(
        `ShiftSlotType with ID ${id} is already deleted`,
      );
    }

    await this.prisma.shiftSlotType.update({
      where: { id },
      data: { isDeleted: true },
    });
    return shiftSlotType;
  }

  async count(userId?: string) {
    return this.prisma.shiftSlotType.count({
      where: userId ? { userId } : undefined,
    });
  }
}
