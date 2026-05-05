import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VoucherRequestDto {
  @ApiProperty({
    description: 'Số điện thoại khách hàng',
    example: '0912345678',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
