import { ApiProperty } from '@nestjs/swagger';

export class VoucherCandidateDto {
  @ApiProperty({ description: 'ID rule trong DB' })
  ruleId: string;

  @ApiProperty({
    description: 'Loại điều kiện (giá trị enum VoucherConditionType)',
    example: 'WARRANTY_ACTIVE',
  })
  conditionType: string;

  @ApiProperty({ description: 'Số tiền giảm (VND)', example: 300000 })
  discountVnd: number;

  @ApiProperty({
    description: 'Nhãn mô tả voucher',
    example: 'Ưu đãi Care+ Pro Max còn hạn',
  })
  label: string;

  @ApiProperty({
    description: 'Cờ tùy biến gắn với rule',
    example: ['careProMax'],
    type: [String],
  })
  flags: string[];
}

export class VoucherDto {
  @ApiProperty({ description: 'ID rule được áp dụng' })
  ruleId: string;

  @ApiProperty({ description: 'Số tiền giảm (VND)', example: 300000 })
  discountVnd: number;

  @ApiProperty({
    description: 'Nhãn mô tả voucher được chọn',
    example: 'Ưu đãi Care+ Pro Max còn hạn',
  })
  label: string;

  @ApiProperty({
    description: 'Loại điều kiện đã match',
    example: 'WARRANTY_ACTIVE',
  })
  conditionType: string;

  @ApiProperty({
    description: 'Cờ tùy biến gắn với rule',
    example: ['careProMax'],
    type: [String],
  })
  flags: string[];
}

export class VoucherResponseDto {
  @ApiProperty({ description: 'Số điện thoại tra cứu', example: '0912345678' })
  phone: string;

  @ApiProperty({ description: 'ID khách hàng KiotViet', required: false })
  customerId?: number;

  @ApiProperty({ description: 'Tên khách hàng', required: false })
  customerName?: string;

  @ApiProperty({ description: 'Comments khách hàng', required: false })
  customerComments?: string;

  @ApiProperty({ description: 'Tổng số hóa đơn đã hoàn thành', example: 3 })
  totalInvoices: number;

  @ApiProperty({
    description: 'Voucher được áp dụng (null nếu không đủ điều kiện)',
    type: VoucherDto,
    nullable: true,
  })
  voucher: VoucherDto | null;

  @ApiProperty({
    description: 'Tất cả ứng viên voucher hợp lệ (để FE hiển thị chi tiết lý do)',
    type: [VoucherCandidateDto],
  })
  candidates: VoucherCandidateDto[];
}
