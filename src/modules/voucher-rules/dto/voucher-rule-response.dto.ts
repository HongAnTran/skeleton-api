import { ApiProperty } from '@nestjs/swagger';
import { VoucherConditionType } from '@prisma/client';

export class VoucherRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: VoucherConditionType })
  conditionType: VoucherConditionType;

  @ApiProperty()
  conditionValue: string;

  @ApiProperty()
  discountVnd: number;

  @ApiProperty({ type: [String] })
  flags: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
