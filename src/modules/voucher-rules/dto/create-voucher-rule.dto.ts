import { ApiProperty } from '@nestjs/swagger';
import { VoucherConditionType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVoucherRuleDto {
  @ApiProperty({
    description: 'Tên/nhãn hiển thị của voucher',
    example: 'Khách thân thiết - 3 hóa đơn',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({
    description: 'Loại điều kiện',
    enum: VoucherConditionType,
    example: VoucherConditionType.INVOICE_COUNT_TIER,
  })
  @IsEnum(VoucherConditionType)
  conditionType: VoucherConditionType;

  @ApiProperty({
    description:
      'Giá trị điều kiện. INVOICE_COUNT_TIER: số (vd "3"). WARRANTY_ACTIVE: tên gói (vd "Bảo Hành CARE⁺ PRO MAX").',
    example: '3',
  })
  @IsString()
  @MinLength(1)
  conditionValue: string;

  @ApiProperty({ description: 'Số tiền giảm (VND)', example: 200000 })
  @IsInt()
  @Min(0)
  discountVnd: number;

  @ApiProperty({
    description: 'Cờ tùy biến (vd ["careProMax"])',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flags?: string[];

  @ApiProperty({
    description: 'Bật/tắt rule (default true)',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
