import { ApiPropertyOptional } from '@nestjs/swagger';
import { VoucherConditionType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class ListVoucherRulesQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo loại điều kiện',
    enum: VoucherConditionType,
  })
  @IsOptional()
  @IsEnum(VoucherConditionType)
  conditionType?: VoucherConditionType;

  @ApiPropertyOptional({
    description: 'Chỉ lấy rule đang bật (true) / tắt (false). Bỏ trống = tất cả.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;
}
