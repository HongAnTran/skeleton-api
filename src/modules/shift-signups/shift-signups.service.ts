import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShiftSignupDto } from './dto/create-shift-signup.dto';
import { LeaveRequestStatus, Prisma, ShiftSignupStatus } from '@prisma/client';

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
      include: {
        signups: {
          where: {
            status: ShiftSignupStatus.PENDING,
          },
        },
        type: true,
      },
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
      throw new BadRequestException('đã đăng ký ca làm việc này');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    const departmentId = employee.departmentId;
    if (departmentId !== shiftSlot.departmentId) {
      throw new BadRequestException(
        'không thể đăng ký ca làm việc của phòng khác',
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

    // Xác định tuần của ca đó (từ thứ 2 đến CN)
    const slotDate = new Date(shiftSignup.slot.date);
    const weekStart = this.getWeekStart(slotDate); // Thứ 2 của tuần đó

    // Kiểm tra deadline: chỉ cho phép hủy trước thứ 2 của tuần đó
    const currentDate = new Date();
    if (currentDate >= weekStart) {
      throw new BadRequestException(
        `Đã quá hạn hủy ca. Chỉ có thể hủy ca trước thứ 2 của tuần làm việc (${weekStart.toLocaleDateString('vi-VN')}). ` +
          `Nếu bạn muốn hủy ca sau thời hạn, vui lòng liên hệ quản lý.`,
      );
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

  async createBulkWeekly(
    employeeId: string,
    createBulkShiftSignupDto: { slotIds: string[] },
  ) {
    const { slotIds } = createBulkShiftSignupDto;

    if (!slotIds || slotIds.length === 0) {
      throw new BadRequestException('Danh sách ca đăng ký không được để trống');
    }

    // 1. Lấy thông tin tất cả các slot
    const shiftSlots = await this.prisma.shiftSlot.findMany({
      where: {
        id: { in: slotIds },
      },
      include: {
        signups: {
          where: {
            status: { not: ShiftSignupStatus.CANCELLED },
          },
        },
        type: true,
        department: true,
      },
    });

    if (shiftSlots.length !== slotIds.length) {
      throw new NotFoundException('Một hoặc nhiều ca làm việc không tồn tại');
    }

    // 2. Lấy thông tin nhân viên
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    const departmentId = employee.departmentId;

    // 3. Kiểm tra tất cả slot cùng department
    const invalidSlots = shiftSlots.filter(
      (slot) => slot.departmentId !== departmentId,
    );
    if (invalidSlots.length > 0) {
      throw new BadRequestException(
        'Bạn không thể đăng ký ca làm việc của phòng khác',
      );
    }

    // 4. Xác định tuần làm việc (từ thứ 2 đến CN)
    const dates = shiftSlots.map((slot) => new Date(slot.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const weekStart = this.getWeekStart(minDate); // Thứ 2
    const weekEnd = this.getWeekEnd(minDate); // Chủ nhật

    // 5. Kiểm tra deadline: chỉ cho phép đăng ký trước thứ 2 của tuần đó
    const currentDate = new Date();
    if (currentDate >= weekStart) {
      throw new BadRequestException(
        `Đã quá hạn đăng ký. Chỉ có thể đăng ký trước thứ 2 của tuần làm việc (${weekStart.toLocaleDateString('vi-VN')})`,
      );
    }

    // 6. Kiểm tra tất cả slot phải trong cùng 1 tuần
    const slotsOutOfWeek = shiftSlots.filter((slot) => {
      const slotDate = new Date(slot.date);
      return slotDate < weekStart || slotDate > weekEnd;
    });

    if (slotsOutOfWeek.length > 0) {
      throw new BadRequestException(
        'Tất cả các ca phải trong cùng 1 tuần (từ thứ 2 đến chủ nhật)',
      );
    }

    // 7. Lấy tất cả slots có sẵn trong tuần cho department (bao gồm capacity và signups)
    const allWeekSlots = await this.prisma.shiftSlot.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
        departmentId: departmentId,
      },
      include: {
        signups: {
          where: {
            status: { not: ShiftSignupStatus.CANCELLED },
          },
        },
      },
    });

    // 8. Lấy các đăng ký hiện tại của nhân viên trong tuần
    const existingSignups = await this.prisma.shiftSignup.findMany({
      where: {
        employeeId: employeeId,
        slot: {
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
          departmentId: departmentId,
        },
        canceledAt: null,
      },
      include: {
        slot: {
          select: {
            date: true,
          },
        },
      },
    });

    // 9. Lấy đơn xin nghỉ được duyệt trong tuần
    // NOTE: Cần tạo model LeaveRequest trước
    const approvedLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId: employeeId,
        status: {
          in: [LeaveRequestStatus.APPROVED],
        },
        OR: [
          {
            startDate: { lte: weekEnd },
            endDate: { gte: weekStart },
          },
        ],
      },
    });

    // 10. Tính các ngày unique trong tuần có slot CÒN CHỖ (bỏ qua ngày đã full slot)
    // Nhóm slots theo ngày và kiểm tra xem ngày nào còn ít nhất 1 slot trống
    const slotsByDay = new Map<string, typeof allWeekSlots>();
    allWeekSlots.forEach((slot) => {
      const dayKey = this.getDateOnly(slot.date).toISOString();
      if (!slotsByDay.has(dayKey)) {
        slotsByDay.set(dayKey, []);
      }
      slotsByDay.get(dayKey)!.push(slot);
    });

    // Chỉ lấy các ngày có ít nhất 1 slot còn chỗ
    const uniqueDaysInWeek = new Set<string>();
    slotsByDay.forEach((slots, dayKey) => {
      const hasAvailableSlot = slots.some(
        (slot) => slot.signups.length < slot.capacity,
      );
      if (hasAvailableSlot) {
        uniqueDaysInWeek.add(dayKey);
      }
    });

    // 11. Tính các ngày sẽ đăng ký (bao gồm cả đăng ký mới và đăng ký cũ)
    const signedUpDays = new Set(
      existingSignups.map((signup) =>
        this.getDateOnly(signup.slot.date).toISOString(),
      ),
    );

    // Thêm các ngày từ đăng ký mới
    shiftSlots.forEach((slot) => {
      signedUpDays.add(this.getDateOnly(slot.date).toISOString());
    });

    // 12. Tính các ngày có đơn nghỉ được duyệt
    const leaveDays = new Set<string>();
    approvedLeaves.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      let current = new Date(start);
      while (current <= end) {
        const dayStr = this.getDateOnly(current).toISOString();
        if (uniqueDaysInWeek.has(dayStr)) {
          leaveDays.add(dayStr);
        }
        current.setDate(current.getDate() + 1);
      }
    });

    // 13. Kiểm tra đầy đủ tuần: từ thứ 2 đến CN
    const missingDays = Array.from(uniqueDaysInWeek).filter(
      (day) => !signedUpDays.has(day) && !leaveDays.has(day),
    );
    console.log(missingDays);
    console.log(signedUpDays);
    console.log(leaveDays);
    console.log(uniqueDaysInWeek);

    if (missingDays.length > 0) {
      throw new BadRequestException(
        `Bạn phải đăng ký đầy đủ các ngày. Nếu bạn vắng ngày nào, vui lòng nộp đơn xin nghỉ trước và phải được duyệt. `,
      );
    }

    // 14. Kiểm tra capacity và duplicate, lọc bỏ các slot vào ngày đã xin off
    const errors: string[] = [];
    const validSlots = shiftSlots.filter((slot) => {
      // Bỏ qua slot vào ngày đã xin off (đã được xử lý ở phần 13)
      const isOff = approvedLeaves.some(
        (leave) =>
          leave.startDate <= new Date(slot.date) &&
          leave.endDate >= new Date(slot.date),
      );
      if (isOff) {
        return false; // Skip slot này
      }

      // Kiểm tra capacity
      if (slot.signups.length >= slot.capacity) {
        errors.push(
          `Ca ngày ${new Date(slot.date).toLocaleDateString('vi-VN')} đã đầy`,
        );
        return false;
      }

      // Kiểm tra đã đăng ký chưa
      const alreadySignedUp = existingSignups.some(
        (signup) => signup.slotId === slot.id,
      );
      if (alreadySignedUp) {
        errors.push(
          `Bạn đã đăng ký ca ngày ${new Date(slot.date).toLocaleDateString('vi-VN')}`,
        );
        return false;
      }

      // Kiểm tra slot trong quá khứ
      if (new Date(slot.date) < currentDate) {
        errors.push(
          `Không thể đăng ký ca trong quá khứ: ${new Date(slot.date).toLocaleDateString('vi-VN')}`,
        );
        return false;
      }

      return true; // Slot hợp lệ
    });

    if (errors.length > 0) {
      throw new BadRequestException(errors.join('; '));
    }

    // 15. Tạo các đăng ký (chỉ cho các slot hợp lệ, đã bỏ qua slot vào ngày đã xin off)
    const signups = await Promise.all(
      validSlots.map(async (slot) => {
        const hours =
          slot.type.endDate.getHours() - slot.type.startDate.getHours();
        const minutes =
          slot.type.endDate.getMinutes() - slot.type.startDate.getMinutes();
        const totalMinutes = hours * 60 + minutes;
        const totalHours = totalMinutes / 60;

        return this.prisma.shiftSignup.create({
          data: {
            employeeId: employeeId,
            slotId: slot.id,
            status: ShiftSignupStatus.PENDING,
            totalHours: totalHours,
          },
          include: {
            slot: {
              include: {
                type: true,
                department: true,
              },
            },
          },
        });
      }),
    );

    return {
      message: 'Đăng ký tuần thành công',
      data: signups,
      weekInfo: {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        totalDays: uniqueDaysInWeek.size,
        signedUpDays: signedUpDays.size,
        leaveDays: leaveDays.size,
      },
    };
  }

  // Helper methods
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    // Thứ 2 = 1, nếu là CN (0) thì lùi về -6
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private getWeekEnd(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Chủ nhật
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  private getDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
