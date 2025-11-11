import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class CreateTaskCycleAllDto {
  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'Period start date',
  })
  @IsDateString()
  periodStart: string;

  @ApiProperty({
    example: '2025-01-31T23:59:59.999Z',
    description: 'Period end date',
  })
  @IsDateString()
  periodEnd: string;
}
