import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsUUID,
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
}
