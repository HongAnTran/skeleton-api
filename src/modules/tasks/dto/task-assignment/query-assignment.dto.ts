import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatusV2 } from '@prisma/client';

export class QueryAssignmentDto {
  @ApiProperty({ description: 'ID của TaskCycle', required: false })
  @IsOptional()
  @IsString()
  cycleId?: string;

  @ApiProperty({ description: 'ID của Employee', required: false })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ description: 'ID của Department', required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({
    description: 'Trạng thái',
    enum: TaskStatusV2,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatusV2)
  status?: TaskStatusV2;
}
