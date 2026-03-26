import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsDateString,
  IsOptional,
  Min,
  IsString,
} from 'class-validator';
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

  @ApiPropertyOptional({
    description:
      'Chỉ tính vào báo cáo iPhone các dòng có productName chứa chuỗi này (không phân biệt hoa thường), ví dụ "16 Pro Max"',
  })
  @IsOptional()
  @IsString()
  productNameContains?: string;
}

export class IphoneMarketTotalsDto {
  @ApiProperty({ description: 'Nhóm New L / Used L (Lock)' })
  lockQuantity: number;

  @ApiProperty({ description: 'Nhóm New Q / Used Q (Quốc tế)' })
  internationalQuantity: number;

  @ApiProperty({
    description:
      'Không xác định được nhóm (thiếu productGroup hoặc không khớp L/Q)',
  })
  unknownMarketQuantity: number;
}

export class IphoneModelBreakdownDto {
  @ApiProperty({ example: 'iPhone 16 Pro Max' })
  modelName: string;

  @ApiProperty({ description: 'Tổng số máy (theo model)' })
  quantity: number;

  @ApiProperty({ description: 'Lock (L)' })
  lockQuantity: number;

  @ApiProperty({ description: 'Quốc tế (Q)' })
  internationalQuantity: number;

  @ApiProperty()
  unknownMarketQuantity: number;
}

export class IphoneStorageBreakdownDto {
  @ApiProperty({ example: '256GB' })
  storage: string;

  @ApiProperty()
  quantity: number;
}

export class IphoneColorBreakdownDto {
  @ApiProperty({ example: 'Desert Titanium' })
  color: string;

  @ApiProperty()
  quantity: number;
}

export class IphoneDetailRowDto {
  @ApiProperty({ example: 'iPhone 16 Pro Max' })
  modelName: string;

  @ApiProperty({ example: '256GB' })
  storage: string;

  @ApiProperty({ example: 'Desert Titanium' })
  color: string;

  @ApiProperty({
    description: 'lock | international | unknown',
    example: 'lock',
  })
  marketType: string;

  @ApiProperty({
    description: 'Nhóm hàng gốc từ KiotViet (nếu có)',
    required: false,
  })
  productGroup?: string;

  @ApiProperty()
  quantity: number;
}

export class IphoneSalesReportDto {
  @ApiProperty({
    description:
      'Tổng số máy iPhone trong báo cáo chi tiết (dòng IMEI, có parse được tên iPhone)',
  })
  totalIphoneUnits: number;

  @ApiProperty({ type: IphoneMarketTotalsDto })
  byMarket: IphoneMarketTotalsDto;

  @ApiProperty({ type: [IphoneModelBreakdownDto] })
  byModel: IphoneModelBreakdownDto[];

  @ApiProperty({ type: [IphoneStorageBreakdownDto] })
  byStorage: IphoneStorageBreakdownDto[];

  @ApiProperty({ type: [IphoneColorBreakdownDto] })
  byColor: IphoneColorBreakdownDto[];

  @ApiProperty({
    description: 'Chi tiết theo model + bộ nhớ + màu + loại Lock/QT',
    type: [IphoneDetailRowDto],
  })
  detailRows: IphoneDetailRowDto[];
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
    description:
      'Số lượng gói bảo hành đã bán (tổng quantity các dòng bảo hành)',
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

  @ApiProperty({
    description:
      'Báo cáo iPhone: theo model (tên dòng máy), Lock/Quốc tế (nhóm L/Q), dung lượng và màu — parse từ productName dạng "iPhone 16 Pro Max 256GB Desert Titanium"',
    type: IphoneSalesReportDto,
  })
  iphoneReport: IphoneSalesReportDto;
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
