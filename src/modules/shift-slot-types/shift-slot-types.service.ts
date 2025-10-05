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
      where: { userId },
      include: {
        user: true,
        shiftSlots: true,
      },
    });
  }

  async findOne(id: string) {
    const shiftSlotType = await this.prisma.shiftSlotType.findUnique({
      where: { id },
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
      where: { userId },
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
        where: { id },
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
        shiftSlots: {
          include: {
            signups: true,
          },
        },
      },
    });
    if (!shiftSlotType) {
      throw new NotFoundException(`ShiftSlotType with ID ${id} not found`);
    }

    if (shiftSlotType.shiftSlots.some((slot) => slot.signups.length > 0)) {
      throw new BadRequestException(
        'Không thể xóa kiểu ca làm việc đã có đăng ký',
      );
    }

    await this.prisma.shiftSlot.deleteMany({
      where: {
        typeId: id,
      },
    });

    return await this.prisma.shiftSlotType.delete({
      where: { id },
    });
  }

  async count(userId?: string) {
    return this.prisma.shiftSlotType.count({
      where: userId ? { userId } : undefined,
    });
  }
}
