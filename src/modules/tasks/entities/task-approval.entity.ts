import { ApiProperty } from '@nestjs/swagger';

export class TaskApprovalEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  instanceId: string;

  @ApiProperty()
  action: string;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty()
  actedBy: string;

  @ApiProperty()
  actedAt: Date;
}
