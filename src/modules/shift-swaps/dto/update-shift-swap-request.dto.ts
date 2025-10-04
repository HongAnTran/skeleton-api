import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ShiftSwapStatus } from '../entities/shift-swap-request.entity';

export class UpdateShiftSwapRequestDto {
  @ApiProperty({
    enum: ShiftSwapStatus,
    description: 'Cập nhật trạng thái yêu cầu đổi ca',
    required: false,
  })
  @IsOptional()
  @IsEnum(ShiftSwapStatus)
  status?: ShiftSwapStatus;

  @ApiProperty({
    description: 'Lý do cập nhật',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Tin nhắn kèm theo',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}
