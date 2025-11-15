import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty({
    description: 'Ngày bắt đầu nghỉ',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc nghỉ',
    example: '2024-01-17T00:00:00.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Lý do xin nghỉ',
    required: false,
    example: 'Nghỉ phép cá nhân',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
