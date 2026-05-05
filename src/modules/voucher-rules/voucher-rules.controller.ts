import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { VoucherRulesService } from './voucher-rules.service';
import { CreateVoucherRuleDto } from './dto/create-voucher-rule.dto';
import { UpdateVoucherRuleDto } from './dto/update-voucher-rule.dto';
import { ListVoucherRulesQueryDto } from './dto/list-voucher-rules.dto';
import { VoucherRuleResponseDto } from './dto/voucher-rule-response.dto';

@ApiTags('Voucher Rules - CRUD')
@Controller('voucher-rules')
export class VoucherRulesController {
  constructor(private readonly service: VoucherRulesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Danh sách voucher rule' })
  @ApiResponse({ status: 200, type: [VoucherRuleResponseDto] })
  list(
    @Query() query: ListVoucherRulesQueryDto,
  ): Promise<VoucherRuleResponseDto[]> {
    return this.service.list(query) as unknown as Promise<
      VoucherRuleResponseDto[]
    >;
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết voucher rule' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: VoucherRuleResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  getById(@Param('id') id: string): Promise<VoucherRuleResponseDto> {
    return this.service.getById(id) as unknown as Promise<VoucherRuleResponseDto>;
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo voucher rule mới' })
  @ApiBody({ type: CreateVoucherRuleDto })
  @ApiResponse({ status: 201, type: VoucherRuleResponseDto })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(
    @Body() dto: CreateVoucherRuleDto,
  ): Promise<VoucherRuleResponseDto> {
    return this.service.create(dto) as unknown as Promise<VoucherRuleResponseDto>;
  }

  @Public()
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật voucher rule' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateVoucherRuleDto })
  @ApiResponse({ status: 200, type: VoucherRuleResponseDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVoucherRuleDto,
  ): Promise<VoucherRuleResponseDto> {
    return this.service.update(id, dto) as unknown as Promise<
      VoucherRuleResponseDto
    >;
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Xoá voucher rule' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Đã xoá' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string): Promise<{ id: string; deleted: true }> {
    return this.service.remove(id);
  }
}
