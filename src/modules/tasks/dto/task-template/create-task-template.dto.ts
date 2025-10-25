import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { TaskScope, Aggregation } from '@prisma/client';

export class CreateTaskTemplateDto {
  @ApiProperty({ example: 'Monthly Sales Target' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Complete monthly sales target for the team',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: TaskScope,
    example: TaskScope.INDIVIDUAL,
    description: 'Task scope: INDIVIDUAL or DEPARTMENT',
  })
  @IsEnum(TaskScope)
  scope: TaskScope;

  @ApiProperty({ example: 1 })
  @IsNumber()
  level: number;

  @ApiProperty({ example: 'units', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  defaultTarget?: number;

  @ApiProperty({
    enum: Aggregation,
    example: Aggregation.SUM,
    default: Aggregation.COUNT,
    required: false,
  })
  @IsOptional()
  @IsEnum(Aggregation)
  aggregation?: Aggregation;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
