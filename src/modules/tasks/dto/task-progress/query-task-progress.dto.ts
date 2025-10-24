import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class QueryTaskProgressDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instanceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  occurredFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  occurredTo?: string;
}
