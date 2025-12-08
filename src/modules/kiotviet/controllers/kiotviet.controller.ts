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
}
