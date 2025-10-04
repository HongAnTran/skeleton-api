import { ApiProperty } from '@nestjs/swagger';

export class ShiftSlot {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  branchId: string;

  @ApiProperty()
  departmentId: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  user?: any;

  @ApiProperty({ required: false })
  branch?: any;

  @ApiProperty({ required: false })
  department?: any;

  @ApiProperty({ required: false, type: [Object] })
  signups?: any[];
}
