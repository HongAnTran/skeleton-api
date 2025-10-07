import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSlotDto } from './dto/create-shift-slot.dto';
import { UpdateShiftSlotDto } from './dto/update-shift-slot.dto';
import { Prisma, ShiftSignupStatus } from '@prisma/client';

@Injectable()
export class ShiftSlotsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createShiftSlotDto: CreateShiftSlotDto) {
    const { typeIds, branchId, departmentIds, capacity, date, note } =
      createShiftSlotDto;
    const existingSlot = await this.prisma.shiftSlot.findFirst({
      where: {
        date: new Date(date),
        branchId: branchId,
        departmentId: {
          in: departmentIds,
        },
        typeId: {
          in: typeIds,
        },
      },
    });

    if (existingSlot) {
      throw new BadRequestException('Đã có ca làm việc trong ngày này');
    }

    for await (const typeId of typeIds) {
      const data: Prisma.ShiftSlotCreateManyInput[] = departmentIds.map(
        (departmentId) => ({
          capacity,
          userId,
          branchId,
          departmentId,
          typeId,
          date: new Date(date),
          note,
        }),
      );

      await this.prisma.shiftSlot.createMany({
        data,
      });
    }

    return {
      message: 'Ca làm việc đã được tạo thành công',
    };
  }

  async createMany(userId: string, createShiftSlotDto: CreateShiftSlotDto) {
    const { date, endDate, branchId, departmentIds, typeIds, capacity, note } =
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
          departmentId: {
            in: departmentIds,
          },
          typeId: {
            in: typeIds,
          },
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

      const allData: Prisma.ShiftSlotCreateManyInput[] = [];

      for (const date of dates) {
        for (const typeId of typeIds) {
          for (const departmentId of departmentIds) {
            allData.push({
              date,
              capacity,
              userId,
              branchId,
              departmentId,
              typeId,
              note,
            });
          }
        }
      }

      await this.prisma.shiftSlot.createMany({
        data: allData,
      });

      return {
        message: 'Ca làm việc đã được tạo thành công',
      };
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
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        signups: {
          select: {
            id: true,
            status: true,
            canceledAt: true,
            cancelReason: true,
            createdAt: true,
            canceledBy: true,
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
            isDeleted: true,
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
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    whereNew.branchId = employee.branchId;
    whereNew.userId = userId;

    if (!where.departmentId) {
      whereNew.departmentId = employee.departmentId;
    }

    return this.prisma.shiftSlot.findMany({
      where: whereNew,
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
        signups: {
          where: {
            status: {
              not: ShiftSignupStatus.CANCELLED,
            },
          },
          select: {
            id: true,
            status: true,
            canceledAt: true,
            cancelReason: true,
            canceledBy: true,
            createdAt: true,
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
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            isDeleted: true,
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
        department: {
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
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            isDeleted: true,
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

      return await this.prisma.shiftSlot.update({
        where: { id },
        data: {
          ...updateShiftSlotDto,
          date: updateShiftSlotDto.date
            ? new Date(updateShiftSlotDto.date)
            : undefined,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Shift slot with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    const shiftSlot = await this.prisma.shiftSlot.findUnique({
      where: { id },
      include: {
        signups: true,
      },
    });
    if (!shiftSlot) {
      throw new NotFoundException(`Shift slot with ID ${id} not found`);
    }

    if (shiftSlot.date < new Date()) {
      throw new BadRequestException('Không thể xóa ca làm việc trong quá khứ');
    }

    return await this.prisma.shiftSlot.delete({
      where: { id },
    });
  }

  async count(where: Prisma.ShiftSlotWhereInput) {
    return this.prisma.shiftSlot.count({
      where,
    });
  }
}
