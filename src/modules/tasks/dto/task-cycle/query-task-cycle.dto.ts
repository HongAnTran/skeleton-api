import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { TaskStatusV2 } from '@prisma/client';

export class QueryTaskCycleDto {
  @ApiProperty({ enum: TaskStatusV2, required: false })
  @IsOptional()
  @IsEnum(TaskStatusV2)
  status?: TaskStatusV2;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  periodStartFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  periodStartTo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  employeeId?: string;
}
