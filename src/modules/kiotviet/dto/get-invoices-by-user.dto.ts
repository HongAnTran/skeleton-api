import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsDateString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceResponseDto } from './invoice-response.dto';

export class GetInvoicesByUserQueryDto {
  @ApiProperty({
    description: 'ID người dùng (nhân viên bán hàng)',
    example: 12345,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiPropertyOptional({
    description: 'Từ ngày giao dịch (ISO datetime)',
    example: '2024-01-01T00:00:00',
  })
  @IsOptional()
  @IsDateString()
  fromPurchaseDate?: string;

  @ApiPropertyOptional({
    description: 'Đến ngày giao dịch (ISO datetime)',
    example: '2024-12-31T23:59:59',
  })
  @IsOptional()
  @IsDateString()
  toPurchaseDate?: string;
}

export class UserInvoicesReportDto {
  @ApiProperty({ description: 'Tổng số đơn hàng' })
  totalOrders: number;

  @ApiProperty({ description: 'Tổng giá trị (tổng doanh thu các đơn)' })
  totalValue: number;

  @ApiProperty({
    description:
      'Doanh thu phụ kiện (tổng tiền các sản phẩm ngoài sản phẩm chính, không bao gồm bảo hành)',
  })
  accessoryRevenue: number;

  @ApiProperty({
    description: 'Doanh thu bảo hành (tổng tiền các dòng sản phẩm bảo hành)',
  })
  warrantyRevenue: number;

  @ApiProperty({ description: 'Số đơn có bảo hành' })
  warrantyOrderCount: number;

  @ApiProperty({
    description: 'Số lượng gói bảo hành đã bán (tổng quantity các dòng bảo hành)',
  })
  warrantyQuantity: number;

  @ApiProperty({
    description: 'Chi tiết theo từng loại bảo hành',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        warrantyType: { type: 'string', example: 'Bảo Hành CARE⁺ PRO MAX' },
        quantity: { type: 'number', example: 3 },
        revenue: { type: 'number', example: 1500000 },
        orderCount: { type: 'number', example: 2 },
      },
    },
  })
  warrantyBreakdown: Array<{
    warrantyType: string;
    quantity: number;
    revenue: number;
    orderCount: number;
  }>;

  @ApiProperty({ description: 'Doanh thu (bằng totalValue)' })
  revenue: number;
}

export class GetInvoicesByUserResponseDto {
  @ApiProperty({
    description: 'Danh sách hóa đơn do user bán',
    type: [InvoiceResponseDto],
  })
  data: InvoiceResponseDto[];

  @ApiProperty({
    description: 'Thống kê báo cáo',
    type: UserInvoicesReportDto,
  })
  report: UserInvoicesReportDto;
}
