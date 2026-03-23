import { ApiProperty } from '@nestjs/swagger';

export class ShiftSignup {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  slotId: string;

  @ApiProperty()
  isCanceled: boolean;

  @ApiProperty()
  canceledAt: Date;

  @ApiProperty()
  cancelReason: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  employee?: any;

  @ApiProperty({ required: false })
  slot?: any;
}
