import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString } from 'class-validator';

export class CreateShiftSlotTypeDto {
  @ApiProperty({ example: 'Morning Shift' })
  @IsString()
  name: string;

  @ApiProperty({ example: '2024-01-01T08:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-01-01T16:00:00Z' })
  @IsDateString()
  endDate: string;
}
