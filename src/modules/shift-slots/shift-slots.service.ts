import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSlotDto } from './dto/create-shift-slot.dto';
import { UpdateShiftSlotDto } from './dto/update-shift-slot.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftSlotsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createShiftSlotDto: CreateShiftSlotDto) {
    const { typeId, branchId, capacity, date, note } = createShiftSlotDto;
    const existingSlot = await this.prisma.shiftSlot.findFirst({
      where: {
        date: new Date(date),
        branchId,
        typeId,
      },
    });

    if (existingSlot) {
      throw new BadRequestException('Đã có ca làm việc trong ngày này');
    }

    return this.prisma.shiftSlot.create({
      data: {
        capacity,
        user: {
          connect: {
            id: userId,
          },
        },
        branch: {
          connect: {
            id: branchId,
          },
        },
        date: new Date(date),
        note,
        type: {
          connect: {
            id: typeId,
          },
        },
      },
    });
  }

  async createMany(userId: string, createShiftSlotDto: CreateShiftSlotDto) {
    const { date, endDate, branchId, typeId, capacity, note } =
      createShiftSlotDto;
    if (endDate) {
      const startDate = new Date(date);
      const endDateValue = new Date(endDate);
      if (endDateValue < startDate) {
        throw new BadRequestException(
          'Ngày kết thúc phải lớn hơn ngày bắt đầu',
        );
      }

      const existingSlot = await this.prisma.shiftSlot.findFirst({
        where: {
          date: {
            gte: startDate,
            lte: endDateValue,
          },
          branchId,
          typeId,
        },
      });
      if (existingSlot) {
        throw new BadRequestException(
          'Đã có ca làm việc trong khoảng thời gian này',
        );
      }

      const dates = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDateValue) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const data = dates.map((date) => ({
        date,
        capacity,
        userId,
        branchId,
        typeId,
        note,
      }));

      return await this.prisma.shiftSlot.createMany({
        data,
      });
    } else {
      throw new BadRequestException('Ngày kết thúc không được để trống');
    }
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
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        signups: {
          select: {
            id: true,
            isCanceled: true,
            canceledAt: true,
            cancelReason: true,
            employee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        type: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            id: true,
          },
        },
      },
    });
  }

  async findAllByEmployee(
    employeeId: string,
    userId: string,
    where: Prisma.ShiftSlotWhereInput,
  ) {
    const whereNew = { ...where };
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        branch: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    whereNew.branchId = employee.branchId;
    whereNew.userId = userId;

    return this.prisma.shiftSlot.findMany({
      where: whereNew,
      include: {
        signups: {
          where: {
            isCanceled: false,
          },
          select: {
            id: true,
            employee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        type: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            id: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const shiftSlot = await this.prisma.shiftSlot.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        signups: {
          select: {
            id: true,
            employee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        type: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            id: true,
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
      const shiftSlot = await this.prisma.shiftSlot.findUnique({
        where: { id },
        include: {
          signups: true,
        },
      });
      if (!shiftSlot) {
        throw new NotFoundException(`Shift slot with ID ${id} not found`);
      }

      if (shiftSlot.signups.length > 0) {
        throw new BadRequestException(
          'Không thể cập nhật ca làm việc đã có đăng ký',
        );
      }

      const updateData = { ...updateShiftSlotDto } as any;
      if (updateShiftSlotDto.date) {
        updateData.date = new Date(updateShiftSlotDto.date);
      }

      return await this.prisma.shiftSlot.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      throw new NotFoundException(`Shift slot with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      const shiftSlot = await this.prisma.shiftSlot.findUnique({
        where: { id },
        include: {
          signups: true,
        },
      });
      if (!shiftSlot) {
        throw new NotFoundException(`Shift slot with ID ${id} not found`);
      }

      if (shiftSlot.signups.length > 0) {
        throw new BadRequestException(
          'Không thể xóa ca làm việc đã có đăng ký',
        );
      }

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
