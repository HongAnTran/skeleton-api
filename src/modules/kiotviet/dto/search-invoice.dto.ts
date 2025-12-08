import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SearchInvoiceDto {
  @ApiProperty({
    description: 'Số điện thoại khách hàng hoặc Serial/IMEI sản phẩm',
    example: '0912345678',
  })
  @IsString()
  @IsNotEmpty()
  phoneOrSerial: string;
}
