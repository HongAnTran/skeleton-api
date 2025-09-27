import { ApiProperty } from '@nestjs/swagger';
import { ShiftSignupStatus } from '@prisma/client';

export class ShiftSignup {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  slotId: string;

  @ApiProperty({ enum: ShiftSignupStatus })
  status: ShiftSignupStatus;

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
