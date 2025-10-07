import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSignupDto } from './dto/create-shift-signup.dto';
import { Prisma, ShiftSignupStatus } from '@prisma/client';

@Injectable()
export class ShiftSignupsService {
  constructor(private prisma: PrismaService) {}

  async create(employeeId: string, createShiftSignupDto: CreateShiftSignupDto) {
    const shiftSlot = await this.prisma.shiftSlot.findUnique({
      where: { id: createShiftSignupDto.slotId },
      include: {
        signups: {
          where: {
            status: {
              not: ShiftSignupStatus.CANCELLED,
            },
          },
        },
        type: true,
      },
    });

    if (!shiftSlot) {
      throw new NotFoundException('Ca làm việc không tồn tại');
    }

    const date = new Date(shiftSlot.date);
    const currentDate = new Date();
    if (date < currentDate) {
      throw new BadRequestException(
        'Không thể đăng ký ca làm việc trong quá khứ',
      );
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
        canceledAt: null,
      },
    });

    if (existingSignup) {
      throw new BadRequestException('Bạn đã đăng ký ca làm việc này');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    const departmentId = employee.departmentId;
    if (departmentId !== shiftSlot.departmentId) {
      throw new BadRequestException(
        'Bạn không thể đăng ký ca làm việc của phòng khác',
      );
    }
    const hours =
      shiftSlot.type.endDate.getHours() - shiftSlot.type.startDate.getHours();

    const minutes =
      shiftSlot.type.endDate.getMinutes() -
      shiftSlot.type.startDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const totalHours = totalMinutes / 60;

    return this.prisma.shiftSignup.create({
      data: {
        employeeId: employeeId,
        slotId: createShiftSignupDto.slotId,
        status: ShiftSignupStatus.PENDING,
        totalHours: totalHours,
      },
    });
  }

  async createByAdmin(
    userId: string,
    createShiftSignupDto: CreateShiftSignupDto,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const shiftSlot = await this.prisma.shiftSlot.findUnique({
      where: { id: createShiftSignupDto.slotId },
      include: { signups: true, type: true },
    });

    const employeeId = createShiftSignupDto.employeeId;

    if (!employeeId) {
      throw new BadRequestException('Employee ID is required');
    }

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
        canceledAt: null,
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

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    const departmentId = employee.departmentId;
    if (departmentId !== shiftSlot.departmentId) {
      throw new BadRequestException(
        'Bạn không thể đăng ký ca làm việc của phòng khác',
      );
    }

    const hours =
      shiftSlot.type.endDate.getHours() - shiftSlot.type.startDate.getHours();
    const minutes =
      shiftSlot.type.endDate.getMinutes() -
      shiftSlot.type.startDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const totalHours = totalMinutes / 60;

    return this.prisma.shiftSignup.create({
      data: {
        employeeId: employeeId,
        slotId: createShiftSignupDto.slotId,
        status: ShiftSignupStatus.PENDING,
        totalHours: totalHours,
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

    if (shiftSignup.status !== ShiftSignupStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy ca làm việc đang chờ xử lý',
      );
    }

    if (shiftSignup.slot.date < new Date()) {
      throw new BadRequestException('Không thể hủy ca làm việc trong quá khứ');
    }

    return this.prisma.shiftSignup.update({
      where: { id, employeeId },
      data: {
        status: ShiftSignupStatus.CANCELLED,
        canceledAt: new Date(),
        cancelReason: cancelReason,
        canceledBy: employeeId,
      },
    });
  }

  async cancelByAdmin(userId: string, id: string, cancelReason: string) {
    if (!userId) {
      throw new ForbiddenException('Bạn không có quyền hủy ca làm việc này');
    }

    const shiftSignup = await this.prisma.shiftSignup.findUnique({
      where: { id },
      include: {
        slot: true,
        employee: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!shiftSignup) {
      throw new NotFoundException(`Shift signup with ID ${id} not found`);
    }

    if (shiftSignup.status === ShiftSignupStatus.CANCELLED) {
      throw new BadRequestException('Ca làm việc đã được hủy trước đó');
    }

    if (shiftSignup.status === ShiftSignupStatus.COMPLETED) {
      throw new BadRequestException('Không thể hủy ca làm việc đã hoàn thành');
    }

    return this.prisma.shiftSignup.update({
      where: { id },
      data: {
        status: ShiftSignupStatus.CANCELLED,
        canceledAt: new Date(),
        cancelReason: cancelReason,
        canceledBy: userId,
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
