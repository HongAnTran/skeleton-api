import { ApiProperty } from '@nestjs/swagger';

export type VoucherSource = 'INVOICE_COUNT' | 'WARRANTY' | 'NONE';

export class VoucherCandidateDto {
  @ApiProperty({
    description: 'Nguồn voucher',
    enum: ['INVOICE_COUNT', 'WARRANTY'],
  })
  source: 'INVOICE_COUNT' | 'WARRANTY';

  @ApiProperty({ description: 'Số tiền giảm (VND)', example: 300000 })
  discountVnd: number;

  @ApiProperty({
    description: 'Nhãn mô tả voucher',
    example: 'Ưu đãi Care+ Pro Max còn hạn',
  })
  label: string;
}

export class VoucherDto {
  @ApiProperty({ description: 'Số tiền giảm (VND)', example: 300000 })
  discountVnd: number;

  @ApiProperty({
    description: 'Nhãn mô tả voucher được chọn',
    example: 'Ưu đãi Care+ Pro Max còn hạn',
  })
  label: string;

  @ApiProperty({
    description: 'Nguồn quyết định voucher',
    enum: ['INVOICE_COUNT', 'WARRANTY', 'NONE'],
  })
  source: VoucherSource;
}

export class VoucherResponseDto {
  @ApiProperty({ description: 'Số điện thoại tra cứu', example: '0912345678' })
  phone: string;

  @ApiProperty({ description: 'ID khách hàng KiotViet', required: false })
  customerId?: number;

  @ApiProperty({ description: 'Tên khách hàng', required: false })
  customerName?: string;

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
