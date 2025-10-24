import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatusV2 } from '@prisma/client';

export class UpdateTaskCycleDto {
  @ApiProperty({
    enum: TaskStatusV2,
    example: TaskStatusV2.COMPLETED,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatusV2)
  status?: TaskStatusV2;
}
