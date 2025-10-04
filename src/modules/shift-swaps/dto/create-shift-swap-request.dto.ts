import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateShiftSwapRequestDto {
  @ApiProperty({ description: 'ID của nhân viên đích muốn đổi ca' })
  @IsString()
  targetId: string;

  @ApiProperty({ description: 'ID ca làm việc của người yêu cầu' })
  @IsString()
  requesterSlotId: string;

  @ApiProperty({ description: 'ID ca làm việc của người đích' })
  @IsString()
  targetSlotId: string;

  @ApiProperty({
    description: 'Lý do đổi ca',
    required: false,
    example: 'Có việc gia đình đột xuất',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Tin nhắn gửi kèm',
    required: false,
    example: 'Anh/chị có thể đổi ca giúp em được không ạ?',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
