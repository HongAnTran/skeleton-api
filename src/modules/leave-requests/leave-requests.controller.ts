import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import {
  UpdateLeaveRequestDto,
  ApproveLeaveRequestDto,
  RejectLeaveRequestDto,
  CancelLeaveRequestDto,
} from './dto/update-leave-request.dto';
import { QueryLeaveRequestDto } from './dto/query-leave-request.dto';
import { LeaveRequest } from './entities/leave-request.entity';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Prisma } from '@prisma/client';
import { User, JwtPayload } from '../../common/decorators/user.decorator';

@ApiTags('Leave Requests')
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn xin nghỉ - Employee only' })
  @ApiResponse({ status: 201, type: LeaveRequest })
  create(
    @User() user: JwtPayload,
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    if (!user.employeeId) {
      throw new BadRequestException(
        'Bạn phải là nhân viên để tạo đơn xin nghỉ',
      );
    }
    return this.leaveRequestsService.create(
      user.employeeId,
      createLeaveRequestDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách đơn xin nghỉ của tôi - Employee only',
  })
  @ApiResponse({ status: 200, type: [LeaveRequest] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDateFrom', required: false, type: String })
  @ApiQuery({ name: 'endDateTo', required: false, type: String })
  async findMyRequests(
    @User() user: JwtPayload,
    @Query() paginationDto: QueryLeaveRequestDto,
  ) {
    if (!user.employeeId) {
      throw new BadRequestException(
        'Bạn phải là nhân viên để xem đơn xin nghỉ',
      );
    }
    const { page, limit, status, startDateFrom, endDateTo } = paginationDto;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveRequestWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (startDateFrom || endDateTo) {
      where.OR = [];
    }
    if (startDateFrom) {
      where.OR.push({
        startDate: { gte: new Date(startDateFrom) },
      });
    }
    if (endDateTo) {
      where.OR.push({
        endDate: { lte: new Date(endDateTo) },
      });
    }

    const [requests, total] = await Promise.all([
      this.leaveRequestsService.findMyRequests(
        user.employeeId,
        where,
        skip,
        limit,
      ),
      this.leaveRequestsService.count({
        employeeId: user.employeeId,
        ...where,
      }),
    ]);

    return {
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get('all')
  @ApiOperation({
    summary: 'Lấy tất cả đơn xin nghỉ với filter - Admin/Manager only',
  })
  @ApiResponse({ status: 200, type: [LeaveRequest] })
  async findAll(@Query() queryDto: QueryLeaveRequestDto) {
    const { page, limit, employeeId, status, startDateFrom, endDateTo } =
      queryDto;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveRequestWhereInput = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (startDateFrom || endDateTo) {
      where.OR = [];
      if (startDateFrom) {
        where.OR.push({
          endDate: { gte: new Date(startDateFrom) },
        });
      }
      if (endDateTo) {
        where.OR.push({
          startDate: { lte: new Date(endDateTo) },
        });
      }
    }

    const [requests, total] = await Promise.all([
      this.leaveRequestsService.findAll(where, skip, limit),
      this.leaveRequestsService.count(where),
    ]);

    return {
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đơn xin nghỉ theo ID' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  findOne(@Param('id') id: string) {
    return this.leaveRequestsService.findOne(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Duyệt đơn xin nghỉ - Admin/Manager only' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  approve(@User() user: JwtPayload, @Param('id') id: string) {
    if (!user.userId) {
      throw new BadRequestException('Bạn không có quyền duyệt đơn xin nghỉ');
    }
    return this.leaveRequestsService.approve(id, user.userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Từ chối đơn xin nghỉ - Admin/Manager only' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  reject(
    @User() user: JwtPayload,
    @Param('id') id: string,
    @Body() rejectDto: RejectLeaveRequestDto,
  ) {
    if (!user.userId) {
      throw new BadRequestException('Bạn không có quyền từ chối đơn xin nghỉ');
    }
    return this.leaveRequestsService.reject(
      id,
      user.userId,
      rejectDto.rejectedReason,
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn xin nghỉ - Employee only' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  cancel(
    @User() user: JwtPayload,
    @Param('id') id: string,
    @Body() cancelDto: CancelLeaveRequestDto,
  ) {
    if (!user.employeeId) {
      throw new BadRequestException(
        'Bạn phải là nhân viên để hủy đơn xin nghỉ',
      );
    }
    return this.leaveRequestsService.cancel(
      user.employeeId,
      id,
      cancelDto.cancelReason,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật đơn xin nghỉ - Employee only' })
  @ApiResponse({ status: 200, type: LeaveRequest })
  update(
    @User() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateLeaveRequestDto: CreateLeaveRequestDto,
  ) {
    if (!user.employeeId) {
      throw new BadRequestException(
        'Bạn phải là nhân viên để cập nhật đơn xin nghỉ',
      );
    }
    return this.leaveRequestsService.update(
      user.employeeId,
      id,
      updateLeaveRequestDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đơn xin nghỉ - Admin only' })
  @ApiResponse({
    status: 200,
    description: 'Leave request deleted successfully',
  })
  remove(@User() user: JwtPayload, @Param('id') id: string) {
    if (!user.userId) {
      throw new BadRequestException('Bạn không có quyền xóa đơn xin nghỉ');
    }
    return this.leaveRequestsService.remove(user.userId, id);
  }
}
