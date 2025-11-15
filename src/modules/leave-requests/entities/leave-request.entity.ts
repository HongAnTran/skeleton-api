import { ApiProperty } from '@nestjs/swagger';
import { LeaveRequestStatus } from '@prisma/client';

export class LeaveRequest {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty({ enum: LeaveRequestStatus })
  status: LeaveRequestStatus;

  @ApiProperty({ required: false })
  approvedBy?: string;

  @ApiProperty({ required: false })
  approvedAt?: Date;

  @ApiProperty({ required: false })
  rejectedBy?: string;

  @ApiProperty({ required: false })
  rejectedAt?: Date;

  @ApiProperty({ required: false })
  rejectedReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  employee?: any;
}
