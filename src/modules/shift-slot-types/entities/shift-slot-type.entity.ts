import { ApiProperty } from '@nestjs/swagger';

export class ShiftSlotType {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  user?: any;

  @ApiProperty({ required: false })
  shiftSlots?: any[];
}
