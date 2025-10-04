import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSwapRequestDto } from './dto/create-shift-swap-request.dto';
import { UpdateShiftSwapRequestDto } from './dto/update-shift-swap-request.dto';
import { ResponseShiftSwapRequestDto } from './dto/response-shift-swap-request.dto';
import { QueryShiftSwapRequestDto } from './dto/query-shift-swap-request.dto';
import { Prisma } from '@prisma/client';
import { ShiftSwapStatus } from './entities/shift-swap-request.entity';
import { PaginatedResult } from '../../common/dtos/pagination.dto';

@Injectable()
export class ShiftSwapsService {
  constructor(private prisma: PrismaService) {}

  async create(requesterId: string, createDto: CreateShiftSwapRequestDto) {
    const [requesterSlot, targetSlot] = await Promise.all([
      this.prisma.shiftSlot.findUnique({
        where: { id: createDto.requesterSlotId },
        include: {
          signups: {
            where: {
              employeeId: requesterId,
              canceledAt: null,
            },
          },
        },
      }),
      this.prisma.shiftSlot.findUnique({
        where: { id: createDto.targetSlotId },
        include: {
          signups: {
            where: {
              employeeId: createDto.targetId,
              canceledAt: null,
            },
          },
        },
      }),
    ]);

    if (!requesterSlot) {
      throw new NotFoundException('Ca làm việc của bạn không tồn tại');
    }

    if (!targetSlot) {
      throw new NotFoundException('Ca làm việc đích không tồn tại');
    }

    if (requesterSlot.signups.length === 0) {
      throw new BadRequestException('Bạn chưa đăng ký ca làm việc này');
    }

    if (targetSlot.signups.length === 0) {
      throw new BadRequestException(
        'Nhân viên đích chưa đăng ký ca làm việc này',
      );
    }

    // Kiểm tra đã có yêu cầu đổi ca tương tự chưa
    const existingRequest = await this.prisma.shiftSwapRequest.findFirst({
      where: {
        requesterId,
        targetId: createDto.targetId,
        requesterSlotId: createDto.requesterSlotId,
        targetSlotId: createDto.targetSlotId,
        status: ShiftSwapStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'Đã tồn tại yêu cầu đổi ca tương tự đang chờ xử lý',
      );
    }

    // Kiểm tra thời gian (không thể đổi ca quá khứ)
    const now = new Date();
    if (requesterSlot.date < now || targetSlot.date < now) {
      throw new BadRequestException('Không thể đổi ca đã qua');
    }

    return this.prisma.shiftSwapRequest.create({
      data: {
        requesterId,
        targetId: createDto.targetId,
        requesterSlotId: createDto.requesterSlotId,
        targetSlotId: createDto.targetSlotId,
        reason: createDto.reason,
        message: createDto.message,
      },
      include: {
        requester: {
          include: { user: { select: { name: true } } },
        },
        target: {
          include: { user: { select: { name: true } } },
        },
        requesterSlot: {
          include: {
            type: true,
            branch: { select: { name: true } },
          },
        },
        targetSlot: {
          include: {
            type: true,
            branch: { select: { name: true } },
          },
        },
      },
    });
  }

  async findAll(
    queryDto: QueryShiftSwapRequestDto,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 10,
      status,
      requesterId,
      targetId,
      search,
    } = queryDto;
    const skip = (page - 1) * limit;

    const where: Prisma.ShiftSwapRequestWhereInput = {};

    if (status) where.status = status;
    if (requesterId) where.requesterId = requesterId;
    if (targetId) where.targetId = targetId;
    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.shiftSwapRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          requester: {
            select: {
              name: true,
            },
          },
          target: {
            select: {
              name: true,
            },
          },
          requesterSlot: {
            include: {
              type: true,
              branch: { select: { name: true } },
            },
          },
          targetSlot: {
            include: {
              type: true,
              branch: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shiftSwapRequest.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const swapRequest = await this.prisma.shiftSwapRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            name: true,
          },
        },
        target: {
          select: {
            name: true,
          },
        },
        requesterSlot: {
          include: {
            type: true,
            branch: { select: { name: true } },
          },
        },
        targetSlot: {
          include: {
            type: true,
            branch: { select: { name: true } },
          },
        },
      },
    });

    if (!swapRequest) {
      throw new NotFoundException(`Yêu cầu đổi ca với ID ${id} không tồn tại`);
    }

    return swapRequest;
  }

  async respond(
    id: string,
    targetId: string,
    responseDto: ResponseShiftSwapRequestDto,
  ) {
    const swapRequest = await this.findOne(id);
    console.log(swapRequest);

    if (swapRequest.targetId !== targetId) {
      throw new ForbiddenException('Bạn không có quyền phản hồi yêu cầu này');
    }

    if (swapRequest.status !== ShiftSwapStatus.PENDING) {
      throw new BadRequestException('Yêu cầu này đã được xử lý');
    }

    const [requesterSignup, targetSignup] = await Promise.all([
      this.prisma.shiftSlot.findFirst({
        where: {
          id: swapRequest.requesterSlotId,
          date: {
            lt: new Date(),
          },
        },
      }),
      this.prisma.shiftSlot.findFirst({
        where: {
          id: swapRequest.targetSlotId,
          date: {
            lt: new Date(),
          },
        },
      }),
    ]);

    if (requesterSignup || targetSignup) {
      throw new BadRequestException('Không thể đổi ca đã qua');
    }

    const updatedRequest = await this.prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        status: responseDto.status,
        message: responseDto.responseMessage,
        respondedAt: new Date(),
      },
    });

    // Nếu được chấp nhận, tự động hoán đổi ca
    if (responseDto.status === ShiftSwapStatus.ACCEPTED) {
      await this.executeSwap(updatedRequest);
    }

    return updatedRequest;
  }

  async cancel(id: string, requesterId: string) {
    const swapRequest = await this.findOne(id);

    if (swapRequest.requesterId !== requesterId) {
      throw new ForbiddenException('Bạn không có quyền hủy yêu cầu này');
    }

    if (swapRequest.status !== ShiftSwapStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể hủy yêu cầu đang chờ xử lý');
    }

    return this.prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        status: ShiftSwapStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });
  }

  async update(id: string, updateDto: UpdateShiftSwapRequestDto) {
    const swapRequest = await this.findOne(id);

    return this.prisma.shiftSwapRequest.update({
      where: { id },
      data: {
        ...updateDto,
        updatedAt: new Date(),
      },
    });
  }

  private async executeSwap(swapRequest: any) {
    await this.prisma.$transaction(async (tx) => {
      const [requesterSignup, targetSignup] = await Promise.all([
        tx.shiftSignup.findFirst({
          where: {
            employeeId: swapRequest.requesterId,
            slotId: swapRequest.requesterSlotId,
            canceledAt: null,
          },
        }),
        tx.shiftSignup.findFirst({
          where: {
            employeeId: swapRequest.targetId,
            slotId: swapRequest.targetSlotId,
            canceledAt: null,
          },
        }),
      ]);

      if (!requesterSignup || !targetSignup) {
        throw new BadRequestException('Không thể thực hiện hoán đổi ca');
      }

      // Cập nhật slot cho các signup
      await Promise.all([
        tx.shiftSignup.update({
          where: { id: requesterSignup.id },
          data: { slotId: swapRequest.targetSlotId },
        }),
        tx.shiftSignup.update({
          where: { id: targetSignup.id },
          data: { slotId: swapRequest.requesterSlotId },
        }),
      ]);

      // Cập nhật trạng thái yêu cầu
      await tx.shiftSwapRequest.update({
        where: { id: swapRequest.id },
        data: { status: ShiftSwapStatus.COMPLETED },
      });
    });
  }

  async count(where: Prisma.ShiftSwapRequestWhereInput) {
    return this.prisma.shiftSwapRequest.count({ where });
  }
}
