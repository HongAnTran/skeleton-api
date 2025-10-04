import { ApiProperty } from '@nestjs/swagger';

export enum ShiftSwapStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class ShiftSwapRequest {
  @ApiProperty()
  id: string;

  @ApiProperty()
  requesterId: string;

  @ApiProperty()
  targetId: string;

  @ApiProperty()
  requesterSlotId: string;

  @ApiProperty()
  targetSlotId: string;

  @ApiProperty({ enum: ShiftSwapStatus })
  status: ShiftSwapStatus;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  respondedAt?: Date;

  // Relations
  @ApiProperty({ required: false })
  requester?: any;

  @ApiProperty({ required: false })
  target?: any;

  @ApiProperty({ required: false })
  requesterSlot?: any;

  @ApiProperty({ required: false })
  targetSlot?: any;
}
