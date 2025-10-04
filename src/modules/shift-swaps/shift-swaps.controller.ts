import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ShiftSwapsService } from './shift-swaps.service';
import { CreateShiftSwapRequestDto } from './dto/create-shift-swap-request.dto';
import { UpdateShiftSwapRequestDto } from './dto/update-shift-swap-request.dto';
import { ResponseShiftSwapRequestDto } from './dto/response-shift-swap-request.dto';
import { QueryShiftSwapRequestDto } from './dto/query-shift-swap-request.dto';
import { ShiftSwapRequest } from './entities/shift-swap-request.entity';
import { User, JwtPayload } from '../../common/decorators/user.decorator';

@ApiTags('Shift Swaps')
@Controller('shift-swaps')
export class ShiftSwapsController {
  constructor(private readonly shiftSwapsService: ShiftSwapsService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo yêu cầu đổi ca mới',
    description: 'Nhân viên tạo yêu cầu đổi ca với nhân viên khác',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo yêu cầu đổi ca thành công',
    type: ShiftSwapRequest,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Ca làm việc không tồn tại' })
  create(
    @User() user: JwtPayload,
    @Body() createDto: CreateShiftSwapRequestDto,
  ) {
    return this.shiftSwapsService.create(user.employeeId, createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách yêu cầu đổi ca',
    description: 'Lấy danh sách yêu cầu đổi ca với các bộ lọc',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu cầu đổi ca',
    type: [ShiftSwapRequest],
  })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số lượng mỗi trang',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Lọc theo trạng thái',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'sent: yêu cầu đã gửi, received: yêu cầu đã nhận',
  })
  async findAll(
    @User() user: JwtPayload,
    @Query() queryDto: QueryShiftSwapRequestDto,
  ) {
    const { type } = queryDto;
    if (type === 'sent') {
      queryDto.requesterId = user.employeeId;
    } else if (type === 'received') {
      queryDto.targetId = user.employeeId;
    }

    return this.shiftSwapsService.findAll(queryDto);
  }

  @Get('sent')
  @ApiOperation({
    summary: 'Lấy danh sách yêu cầu đổi ca đã gửi',
    description:
      'Lấy danh sách các yêu cầu đổi ca mà nhân viên hiện tại đã gửi',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu cầu đổi ca đã gửi',
    type: [ShiftSwapRequest],
  })
  async findSentRequests(
    @User() user: JwtPayload,
    @Query() queryDto: QueryShiftSwapRequestDto,
  ) {
    queryDto.requesterId = user.employeeId;
    return this.shiftSwapsService.findAll(queryDto);
  }

  @Get('received')
  @ApiOperation({
    summary: 'Lấy danh sách yêu cầu đổi ca đã nhận',
    description:
      'Lấy danh sách các yêu cầu đổi ca được gửi cho nhân viên hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách yêu cầu đổi ca đã nhận',
    type: [ShiftSwapRequest],
  })
  async findReceivedRequests(
    @User() user: JwtPayload,
    @Query() queryDto: QueryShiftSwapRequestDto,
  ) {
    queryDto.targetId = user.employeeId;
    return this.shiftSwapsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết yêu cầu đổi ca',
    description: 'Lấy thông tin chi tiết của một yêu cầu đổi ca',
  })
  @ApiParam({ name: 'id', description: 'ID của yêu cầu đổi ca' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết yêu cầu đổi ca',
    type: ShiftSwapRequest,
  })
  @ApiResponse({ status: 404, description: 'Yêu cầu đổi ca không tồn tại' })
  async findOne(@Param('id') id: string, @User() user: JwtPayload) {
    const swapRequest = await this.shiftSwapsService.findOne(id);

    // Kiểm tra quyền truy cập (chỉ requester hoặc target mới được xem)
    if (
      swapRequest.requesterId !== user.employeeId &&
      swapRequest.targetId !== user.employeeId
    ) {
      throw new ForbiddenException('Bạn không có quyền xem yêu cầu này');
    }

    return swapRequest;
  }

  @Patch(':id/respond')
  @ApiOperation({
    summary: 'Phản hồi yêu cầu đổi ca',
    description:
      'Chấp nhận hoặc từ chối yêu cầu đổi ca (chỉ target mới có thể phản hồi)',
  })
  @ApiParam({ name: 'id', description: 'ID của yêu cầu đổi ca' })
  @ApiResponse({
    status: 200,
    description: 'Phản hồi yêu cầu đổi ca thành công',
    type: ShiftSwapRequest,
  })
  @ApiResponse({ status: 400, description: 'Yêu cầu đã được xử lý' })
  @ApiResponse({ status: 403, description: 'Không có quyền phản hồi' })
  respond(
    @Param('id') id: string,
    @User() user: JwtPayload,
    @Body() responseDto: ResponseShiftSwapRequestDto,
  ) {
    return this.shiftSwapsService.respond(id, user.employeeId, responseDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Hủy yêu cầu đổi ca',
    description: 'Hủy yêu cầu đổi ca (chỉ requester mới có thể hủy)',
  })
  @ApiParam({ name: 'id', description: 'ID của yêu cầu đổi ca' })
  @ApiResponse({
    status: 200,
    description: 'Hủy yêu cầu đổi ca thành công',
    type: ShiftSwapRequest,
  })
  @ApiResponse({
    status: 400,
    description: 'Chỉ có thể hủy yêu cầu đang chờ xử lý',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền hủy yêu cầu' })
  cancel(@Param('id') id: string, @User() user: JwtPayload) {
    return this.shiftSwapsService.cancel(id, user.employeeId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật yêu cầu đổi ca',
    description: 'Cập nhật thông tin yêu cầu đổi ca',
  })
  @ApiParam({ name: 'id', description: 'ID của yêu cầu đổi ca' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật yêu cầu đổi ca thành công',
    type: ShiftSwapRequest,
  })
  @ApiResponse({ status: 404, description: 'Yêu cầu đổi ca không tồn tại' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateShiftSwapRequestDto,
  ) {
    return this.shiftSwapsService.update(id, updateDto);
  }
}
