import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Frequency } from '@prisma/client';

export class CreateTaskScheduleDto {
  @ApiProperty({ example: 'clxxx123456789' })
  @IsString()
  templateId: string;

  @ApiProperty({
    enum: Frequency,
    example: Frequency.MONTHLY,
    default: Frequency.MONTHLY,
  })
  @IsEnum(Frequency)
  frequency: Frequency;

  @ApiProperty({
    example: 1,
    description: 'Interval between recurrences (e.g., every 2 weeks)',
    default: 1,
  })
  @IsInt()
  @Min(1)
  interval: number;

  @ApiProperty({
    example: 1,
    description: 'Day of month (1-31) for monthly recurring tasks',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Start date of the schedule',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2025-12-31T23:59:59.999Z',
    description: 'End date of the schedule',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
