import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { KiotVietService } from '../services/kiotviet.service';
import { SearchInvoiceDto } from '../dto/search-invoice.dto';
import { InvoiceResponseDto } from '../dto/invoice-response.dto';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { GetUsersResponseDto } from '../dto/user-response.dto';
import {
  GetInvoicesByUserQueryDto,
  GetInvoicesByUserResponseDto,
} from '../dto/get-invoices-by-user.dto';

@ApiTags('KiotViet - Tra cứu bảo hành')
@Controller('kiotviet')
export class KiotVietController {
  constructor(private readonly kiotVietService: KiotVietService) {}

  @Public()
  @Post('invoices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tra cứu thông tin hóa đơn bảo hành',
    description:
      'Tra cứu thông tin hóa đơn bằng số điện thoại hoặc serial/IMEI. Hệ thống sẽ tự động nhận diện loại input và tìm kiếm tương ứng.',
  })
  @ApiBody({ type: SearchInvoiceDto })
  @ApiResponse({
    status: 200,
    description: 'Danh sách hóa đơn tìm được',
    type: [InvoiceResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Thiếu thông tin tra cứu',
  })
  @ApiResponse({
    status: 503,
    description: 'Không thể kết nối tới KiotViet API',
  })
  async searchInvoices(
    @Body() searchDto: SearchInvoiceDto,
  ): Promise<InvoiceResponseDto[]> {
    return this.kiotVietService.searchInvoices(searchDto);
  }

  @Public()
  @Get('users')
  @ApiOperation({
    summary: 'Lấy danh sách người dùng',
    description:
      'Trả về danh sách toàn bộ người dùng của cửa hàng đã xác nhận, không bao gồm Super Admin (isAdmin = true).',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng',
    type: GetUsersResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Không thể kết nối tới KiotViet API',
  })
  async getUsers(
    @Query() query: GetUsersQueryDto,
  ): Promise<GetUsersResponseDto> {
    return this.kiotVietService.getUsers(query);
  }

  @Public()
  @Get('invoices/by-user')
  @ApiOperation({
    summary: 'Lấy danh sách hóa đơn do một user bán',
    description:
      'Lấy toàn bộ hóa đơn trong khoảng thời gian (nếu truyền), lọc theo userId (soldById), trả về danh sách kèm báo cáo: tổng số đơn, tổng giá trị, số đơn có bảo hành, doanh thu.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách hóa đơn và thống kê báo cáo',
    type: GetInvoicesByUserResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Không thể kết nối tới KiotViet API',
  })
  async getInvoicesByUser(
    @Query() query: GetInvoicesByUserQueryDto,
  ): Promise<GetInvoicesByUserResponseDto> {
    return this.kiotVietService.getInvoicesByUser(query);
  }
}
