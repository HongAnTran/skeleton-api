import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import {
  UpdateLeaveRequestDto,
  ApproveLeaveRequestDto,
  RejectLeaveRequestDto,
  CancelLeaveRequestDto,
} from './dto/update-leave-request.dto';
import { LeaveRequestStatus, Prisma } from '@prisma/client';

@Injectable()
export class LeaveRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(
    employeeId: string,
    createLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    const { startDate, endDate, reason } = createLeaveRequestDto;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start > end) {
      throw new BadRequestException('Ngày bắt đầu không thể sau ngày kết thúc');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      throw new BadRequestException(
        'Không thể tạo đơn xin nghỉ cho ngày trong quá khứ',
      );
    }

    // Check for overlapping leave requests
    const overlappingLeaves = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: {
          in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED],
        },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlappingLeaves) {
      throw new BadRequestException(
        'Bạn đã có đơn xin nghỉ trong khoảng thời gian này',
      );
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        startDate: start,
        endDate: end,
        reason,
        status: LeaveRequestStatus.PENDING,
      },
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
    });
  }

  async findAll(
    where: Prisma.LeaveRequestWhereInput,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.leaveRequest.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    return leaveRequest;
  }

  async findMyRequests(
    employeeId: string,
    where: Prisma.LeaveRequestWhereInput,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId, ...where },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
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
    });
  }

  async approve(id: string, userId: string) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể duyệt đơn xin nghỉ đang chờ xử lý',
      );
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
      },
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
    });
  }

  async reject(id: string, userId: string, rejectedReason: string) {
    if (!rejectedReason || rejectedReason.trim() === '') {
      throw new BadRequestException('Lý do từ chối là bắt buộc');
    }

    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể từ chối đơn xin nghỉ đang chờ xử lý',
      );
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.REJECTED,
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectedReason: rejectedReason.trim(),
      },
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
    });
  }

  async cancel(employeeId: string, id: string, cancelReason: string) {
    if (!cancelReason || cancelReason.trim() === '') {
      throw new BadRequestException('Lý do hủy là bắt buộc');
    }

    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id, employeeId },
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy đơn xin nghỉ đang chờ xử lý',
      );
    }

    // Check if the leave request start date has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(leaveRequest.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Không thể hủy đơn xin nghỉ đã bắt đầu');
    }

    return this.prisma.leaveRequest.update({
      where: { id, employeeId },
      data: {
        status: LeaveRequestStatus.CANCELLED,
      },
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
    });
  }

  async update(
    employeeId: string,
    id: string,
    updateLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id, employeeId },
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể chỉnh sửa đơn xin nghỉ đang chờ xử lý',
      );
    }

    const { startDate, endDate, reason } = updateLeaveRequestDto;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (start > end) {
      throw new BadRequestException('Ngày bắt đầu không thể sau ngày kết thúc');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      throw new BadRequestException(
        'Không thể chỉnh sửa đơn xin nghỉ cho ngày trong quá khứ',
      );
    }

    // Check for overlapping leave requests (excluding current one)
    const overlappingLeaves = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        id: { not: id },
        status: {
          in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED],
        },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlappingLeaves) {
      throw new BadRequestException(
        'Bạn đã có đơn xin nghỉ trong khoảng thời gian này',
      );
    }

    return this.prisma.leaveRequest.update({
      where: { id, employeeId },
      data: {
        startDate: start,
        endDate: end,
        reason,
      },
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
    });
  }

  async remove(userId: string, id: string) {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request with ID ${id} not found`);
    }

    // Only allow deletion if status is PENDING or CANCELLED
    if (
      leaveRequest.status !== LeaveRequestStatus.PENDING &&
      leaveRequest.status !== LeaveRequestStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Chỉ có thể xóa đơn xin nghỉ đang chờ xử lý hoặc đã hủy',
      );
    }

    return this.prisma.leaveRequest.delete({
      where: { id },
    });
  }

  async count(where: Prisma.LeaveRequestWhereInput) {
    return this.prisma.leaveRequest.count({
      where,
    });
  }
}
