import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({
    example: 10,
    description: 'Change in quantity (can be positive or negative)',
  })
  @IsNumber()
  delta: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
