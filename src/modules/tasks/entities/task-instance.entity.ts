import { ApiProperty } from '@nestjs/swagger';
import { TaskScope, TaskStatusV2 } from '@prisma/client';

export class TaskInstanceEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  cycleId: string;

  @ApiProperty({ enum: TaskScope })
  scope: TaskScope;

  @ApiProperty({ required: false })
  employeeId?: string;

  @ApiProperty({ required: false })
  departmentId?: string;

  @ApiProperty()
  level: number;

  @ApiProperty()
  required: boolean;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  target?: number;

  @ApiProperty({ required: false })
  unit?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ enum: TaskStatusV2 })
  status: TaskStatusV2;

  @ApiProperty({ required: false })
  completedAt?: Date;

  @ApiProperty({ required: false })
  completedBy?: string;

  @ApiProperty({ required: false })
  approvedAt?: Date;

  @ApiProperty({ required: false })
  approvedBy?: string;

  @ApiProperty({ required: false })
  rejectedAt?: Date;

  @ApiProperty({ required: false })
  rejectedBy?: string;

  @ApiProperty({ required: false })
  rejectedReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
