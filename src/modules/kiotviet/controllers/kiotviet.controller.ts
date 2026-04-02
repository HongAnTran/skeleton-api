import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  Req,
  UnauthorizedException,
  ServiceUnavailableException,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
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
import { KiotVietWebhookExampleDto } from 'src/modules/kiotviet/dto/kiotviet-webhook.dto';

@ApiTags('KiotViet - Tra cứu bảo hành')
@Controller('kiotviet')
export class KiotVietController {
  constructor(private readonly kiotVietService: KiotVietService) { }

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
    summary: 'Lấy danh sách hóa đơn (theo user hoặc toàn bộ)',
    description:
      'Lấy hóa đơn trong khoảng thời gian (nếu truyền). Có userId thì chỉ đơn do user đó bán (soldById); không có userId thì toàn bộ đơn trong khoảng thời gian. Trả về danh sách kèm báo cáo: tổng, doanh thu, bảo hành, và báo cáo iPhone theo model / Lock–Quốc tế (nhóm L,Q) / dung lượng / màu.',
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

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'X-Hub-Signature',
    required: true,
    description:
      'Chữ ký HMAC-SHA256 dạng hex (có thể có tiền tố sha256=) từ secret và raw body.',
  })
  @ApiOperation({
    summary: 'Webhook KiotViet',
    description:
      'Nhận sự kiện từ KiotViet. So khớp X-Hub-Signature với HMAC-SHA256(secret, raw body). Chữ ký sai → 401 (KiotViet sẽ ngưng gửi nếu trả 4xx). Cấu hình secret: KIOTVIET_WEBHOOK_SECRET.',
  })
  @ApiBody({ type: KiotVietWebhookExampleDto })
  @ApiResponse({ status: 200, description: 'Đã nhận và xác minh webhook' })
  @ApiResponse({
    status: 401,
    description: 'Thiếu/ sai X-Hub-Signature hoặc không đọc được body để xác minh',
  })
  @ApiResponse({
    status: 503,
    description: 'Chưa cấu hình KIOTVIET_WEBHOOK_SECRET trên server',
  })
  kiotVietWebhook(
    @Body() body: KiotVietWebhookExampleDto,
  ): { ok: true } {
    this.kiotVietService.handleWebhookPayload(body);
    return { ok: true };
  }
}
