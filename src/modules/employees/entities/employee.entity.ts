import { ApiProperty } from '@nestjs/swagger';

export class Employee {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false })
  branchId?: string;

  @ApiProperty({ required: false })
  departmentId?: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  currentLevel: number;

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
  shiftSignups?: any[];

  @ApiProperty({ required: false })
  tasks?: any[];
}
