import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSignupDto } from './dto/create-shift-signup.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ShiftSignupsService {
  constructor(private prisma: PrismaService) {}

  async create(employeeId: string, createShiftSignupDto: CreateShiftSignupDto) {
    const shiftSlot = await this.prisma.shiftSlot.findUnique({
      where: { id: createShiftSignupDto.slotId },
      include: { signups: true },
    });

    if (!shiftSlot) {
      throw new NotFoundException('Ca làm việc không tồn tại');
    }

    if (shiftSlot.signups.length >= shiftSlot.capacity) {
      throw new BadRequestException(
        `Ca làm việc đã đầy, tối đa ${shiftSlot.capacity} nhân viên`,
      );
    }

    const existingSignup = await this.prisma.shiftSignup.findFirst({
      where: {
        employeeId: employeeId,
        slotId: createShiftSignupDto.slotId,
        isCanceled: false,
      },
    });

    if (existingSignup) {
      throw new BadRequestException('Bạn đã đăng ký ca làm việc này');
    }

    const date = new Date(shiftSlot.date);
    const currentDate = new Date();
    if (date < currentDate) {
      throw new BadRequestException(
        'Không thể đăng ký ca làm việc trong quá khứ',
      );
    }

    return this.prisma.shiftSignup.create({
      data: {
        employeeId: employeeId,
        slotId: createShiftSignupDto.slotId,
      },
    });
  }

  async findAll(
    where: Prisma.ShiftSignupWhereInput,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.shiftSignup.findMany({
      where,
      skip,
      take,
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
        slot: {
          include: {
            branch: true,
            type: true,
          },
        },
      },
    });
  }

  async cancel(employeeId: string, id: string, cancelReason: string) {
    const shiftSignup = await this.prisma.shiftSignup.findUnique({
      where: { id, employeeId },
      include: {
        slot: true,
      },
    });
    if (!shiftSignup) {
      throw new NotFoundException(`Shift signup with ID ${id} not found`);
    }

    if (
      shiftSignup.slot.date <
      new Date(new Date().setDate(new Date().getDate() - 1))
    ) {
      throw new BadRequestException('Không thể hủy ca làm việc trước 1 ngày');
    }

    return this.prisma.shiftSignup.update({
      where: { id, employeeId },
      data: {
        isCanceled: true,
        canceledAt: new Date(),
        cancelReason: cancelReason,
      },
    });
  }

  async remove(userId: string, id: string) {
    try {
      const shiftSignup = await this.prisma.shiftSignup.findUnique({
        where: { id },
        include: {
          slot: true,
        },
      });
      const slot = await this.prisma.shiftSlot.findUnique({
        where: { id: shiftSignup.slotId, userId },
      });

      if (!slot) {
        throw new NotFoundException(
          `Shift slot with ID ${shiftSignup.slotId} not found`,
        );
      }

      if (!shiftSignup) {
        throw new NotFoundException(`Shift signup with ID ${id} not found`);
      }

      if (shiftSignup.slot.date < new Date()) {
        throw new BadRequestException(
          'Không thể xóa lịch làm việc trong quá khứ',
        );
      }

      return await this.prisma.shiftSignup.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Shift signup with ID ${id} not found`);
    }
  }

  async count(where: Prisma.ShiftSignupWhereInput) {
    return this.prisma.shiftSignup.count({
      where,
    });
  }
}
