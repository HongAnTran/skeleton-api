import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsUUID,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: 'Complete inventory check' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Check all items in stock', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ example: 1, minimum: 1, required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;

  @ApiProperty({ example: 1, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isTeamTask?: boolean;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ example: 'máy', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: '100', required: false })
  @IsOptional()
  @IsNumber()
  target?: number;
}
