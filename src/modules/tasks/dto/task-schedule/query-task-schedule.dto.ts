import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Frequency } from '@prisma/client';

export class QueryTaskScheduleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ enum: Frequency, required: false })
  @IsOptional()
  @IsEnum(Frequency)
  frequency?: Frequency;
}
