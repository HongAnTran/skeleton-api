import { ApiProperty } from '@nestjs/swagger';

export class WarrantyInfoDto {
  @ApiProperty({
    description: 'Số ngày bảo hành',
    example: 90,
  })
  warrantyDays: number;

  @ApiProperty({
    description: 'Ngày bắt đầu bảo hành (ngày mua hàng)',
    example: '2024-01-15T00:00:00',
  })
  warrantyStartDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc bảo hành',
    example: '2024-04-15T00:00:00',
  })
  warrantyEndDate: string;

  @ApiProperty({
    description: 'Số ngày bảo hành còn lại',
    example: 45,
  })
  remainingDays: number;

  @ApiProperty({
    description: 'Loại bảo hành',
    example: 'Bảo Hành Mở Rộng',
  })
  warrantyType: string;

  @ApiProperty({
    description: 'Trạng thái bảo hành',
    example: 'Còn hiệu lực',
    enum: ['Còn hiệu lực', 'Hết hạn'],
  })
  status: string;
}
