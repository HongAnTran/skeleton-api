import { ApiProperty } from '@nestjs/swagger';

export class TaskProgressEventEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  instanceId: string;

  @ApiProperty()
  delta: number;

  @ApiProperty({ required: false })
  source?: string;

  @ApiProperty({ required: false })
  note?: string;

  @ApiProperty()
  occurredAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  createdBy?: string;
}
