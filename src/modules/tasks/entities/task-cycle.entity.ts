import { ApiProperty } from '@nestjs/swagger';
import { TaskStatusV2 } from '@prisma/client';

export class TaskCycleEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  scheduleId: string;

  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty({ enum: TaskStatusV2 })
  status: TaskStatusV2;
}
