import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { TaskStatusV2 } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryTaskDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ enum: TaskStatusV2, required: false })
  @IsOptional()
  @IsEnum(TaskStatusV2)
  status?: TaskStatusV2;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  level?: number;
}
