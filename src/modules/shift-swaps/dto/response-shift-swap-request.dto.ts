import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ShiftSwapStatus } from '../entities/shift-swap-request.entity';

export class ResponseShiftSwapRequestDto {
  @ApiProperty({
    enum: ShiftSwapStatus,
    description: 'Phản hồi cho yêu cầu đổi ca',
    example: ShiftSwapStatus.ACCEPTED,
  })
  @IsEnum(ShiftSwapStatus)
  status: ShiftSwapStatus.ACCEPTED | ShiftSwapStatus.REJECTED;

  @ApiProperty({
    description: 'Tin nhắn phản hồi',
    required: false,
    example: 'OK, tôi có thể đổi ca với bạn',
  })
  @IsOptional()
  @IsString()
  responseMessage?: string;
}
