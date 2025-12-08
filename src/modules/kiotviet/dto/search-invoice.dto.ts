import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class SearchInvoiceDto {
  @ApiProperty({
    description: 'Số điện thoại khách hàng',
    example: '0912345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.orderCode && !o.serial)
  phone?: string;

  @ApiProperty({
    description: 'Serial/IMEI sản phẩm',
    example: 'IMEI123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.phone && !o.orderCode)
  serial?: string;
}
