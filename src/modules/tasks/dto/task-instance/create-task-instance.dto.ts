import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';
import { TaskScope } from '@prisma/client';

export class CreateTaskInstanceDto {
  @ApiProperty({ example: 'clxxx123456789' })
  @IsString()
  templateId: string;

  @ApiProperty({ example: 'clxxx123456789' })
  @IsString()
  cycleId: string;

  @ApiProperty({ enum: TaskScope, example: TaskScope.INDIVIDUAL })
  @IsEnum(TaskScope)
  scope: TaskScope;

  @ApiProperty({ example: 'clxxx123456789', required: false })
  @ValidateIf((o) => o.scope === TaskScope.INDIVIDUAL)
  @IsString()
  employeeId?: string;

  @ApiProperty({ example: 'clxxx123456789', required: false })
  @ValidateIf((o) => o.scope === TaskScope.DEPARTMENT)
  @IsString()
  departmentId?: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  level: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  required: boolean;

  @ApiProperty({ example: 'Complete monthly sales target' })
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  target?: number;

  @ApiProperty({ example: 'units', required: false })
  @IsOptional()
  @IsString()
  unit?: string;
}
