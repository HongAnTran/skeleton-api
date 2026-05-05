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
import { KiotVietWebhookExampleDto } from '../dto/kiotviet-webhook.dto';
import { VoucherRequestDto } from '../dto/voucher-request.dto';
import { VoucherResponseDto } from '../dto/voucher-response.dto';

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
  @Post('vouchers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tính voucher khách hàng theo số điện thoại',
    description:
      'Lấy toàn bộ hóa đơn hoàn thành của khách từ KiotViet, áp rule voucher từ config JSON (tier số hóa đơn + Care+ Pro Max còn hạn) và trả về voucher có giá trị cao nhất.',
  })
  @ApiBody({ type: VoucherRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Thông tin voucher tính được cho khách',
    type: VoucherResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Thiếu số điện thoại' })
  @ApiResponse({ status: 500, description: 'KiotViet chưa cấu hình hoặc lỗi hệ thống' })
  async calculateVoucher(
    @Body() dto: VoucherRequestDto,
  ): Promise<VoucherResponseDto> {
    return this.kiotVietService.calculateVoucherByPhone(dto.phone);
  }

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: KiotVietWebhookExampleDto })
  @ApiResponse({ status: 200, description: 'Đã nhận webhook' })
  kiotVietWebhook(
    /** Object/Record: không qua forbidNonWhitelisted của ValidationPipe toàn cục (payload KiotViet có thể có field thêm). */
    @Body() body: any,
  ): { ok: true } {
    this.kiotVietService.handleWebhookPayload(body as KiotVietWebhookExampleDto);
    return { ok: true };
  }
}
