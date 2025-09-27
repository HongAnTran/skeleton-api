import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSignupDto } from './dto/create-shift-signup.dto';
import { UpdateShiftSignupDto } from './dto/update-shift-signup.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Prisma, ShiftSignupStatus } from '@prisma/client';

@Injectable()
export class ShiftSignupsService {
  constructor(private prisma: PrismaService) {}

  async create(createShiftSignupDto: CreateShiftSignupDto) {
    const shiftSlot = await this.prisma.shiftSlot.findUnique({
      where: { id: createShiftSignupDto.slotId },
      include: { signups: true },
    });

    if (!shiftSlot) {
      throw new NotFoundException('Shift slot not found');
    }

    const confirmedSignups = shiftSlot.signups.filter(
      (signup) => signup.status === ShiftSignupStatus.CONFIRMED,
    );

    if (confirmedSignups.length >= shiftSlot.capacity) {
      throw new BadRequestException('Shift slot is already at full capacity');
    }

    const existingSignup = await this.prisma.shiftSignup.findFirst({
      where: {
        employeeId: createShiftSignupDto.employeeId,
        slotId: createShiftSignupDto.slotId,
        status: {
          not: ShiftSignupStatus.CANCELLED,
        },
      },
    });

    if (existingSignup) {
      throw new BadRequestException(
        'Employee has already signed up for this shift slot',
      );
    }

    return this.prisma.shiftSignup.create({
      data: createShiftSignupDto,
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
          },
        },
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
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const shiftSignup = await this.prisma.shiftSignup.findUnique({
      where: { id },
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
          },
        },
      },
    });

    if (!shiftSignup) {
      throw new NotFoundException(`Shift signup with ID ${id} not found`);
    }

    return shiftSignup;
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const shiftSignup = await this.prisma.shiftSignup.findUnique({
      where: { id },
      include: { slot: { include: { signups: true } } },
    });

    if (!shiftSignup) {
      throw new NotFoundException(`Shift signup with ID ${id} not found`);
    }

    if (updateStatusDto.status === ShiftSignupStatus.CONFIRMED) {
      const confirmedSignups = shiftSignup.slot.signups.filter(
        (signup) =>
          signup.status === ShiftSignupStatus.CONFIRMED && signup.id !== id,
      );

      if (confirmedSignups.length >= shiftSignup.slot.capacity) {
        throw new BadRequestException('Shift slot is already at full capacity');
      }
    }

    return this.prisma.shiftSignup.update({
      where: { id },
      data: { status: updateStatusDto.status },
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
          },
        },
      },
    });
  }

  async update(id: string, updateShiftSignupDto: UpdateShiftSignupDto) {
    try {
      return await this.prisma.shiftSignup.update({
        where: { id },
        data: updateShiftSignupDto,
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
            },
          },
        },
      });
    } catch (error) {
      throw new NotFoundException(`Shift signup with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
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
