import { ApiProperty } from '@nestjs/swagger';
import { TaskScope, Aggregation } from '@prisma/client';

export class TaskTemplateEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: TaskScope })
  scope: TaskScope;

  @ApiProperty({ required: false })
  unit?: string;

  @ApiProperty({ required: false })
  defaultTarget?: number;

  @ApiProperty({ enum: Aggregation })
  aggregation: Aggregation;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
