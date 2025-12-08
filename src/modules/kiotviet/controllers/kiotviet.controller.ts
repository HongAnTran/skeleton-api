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
  @ApiBody({ type: SearchInvoiceDto })
  async searchInvoices(
    @Body() searchDto: SearchInvoiceDto,
  ): Promise<InvoiceResponseDto[]> {
    return this.kiotVietService.searchInvoices(searchDto);
  }
}
