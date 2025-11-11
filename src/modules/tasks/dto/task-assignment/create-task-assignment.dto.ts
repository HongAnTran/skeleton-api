import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatusV2 } from '@prisma/client';

export class CreateTaskAssignmentDto {
  @ApiProperty({ description: 'ID của TaskCycle' })
  @IsString()
  cycleId: string;

  @ApiProperty({ description: 'ID của Employee' })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Số lượng ban đầu', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({
    description: 'Trạng thái ban đầu',
    enum: TaskStatusV2,
    required: false,
    default: TaskStatusV2.PENDING,
  })
  @IsOptional()
  @IsEnum(TaskStatusV2)
  status?: TaskStatusV2;
}
