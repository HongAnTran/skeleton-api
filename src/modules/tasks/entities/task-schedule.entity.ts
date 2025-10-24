import { ApiProperty } from '@nestjs/swagger';
import { Frequency } from '@prisma/client';

export class TaskScheduleEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty({ enum: Frequency })
  frequency: Frequency;

  @ApiProperty()
  interval: number;

  @ApiProperty({ required: false })
  dayOfMonth?: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty({ required: false })
  endDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
