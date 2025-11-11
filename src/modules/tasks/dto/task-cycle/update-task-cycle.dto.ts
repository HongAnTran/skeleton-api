import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateTaskCycleDto {
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  periodStart: string;

  @ApiProperty({ example: '2025-01-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  periodEnd: string;
}
