import { ApiProperty } from '@nestjs/swagger';

export class UserData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [Object], required: false })
  employees?: any[];

  @ApiProperty({ type: [Object], required: false })
  branches?: any[];

  @ApiProperty({ type: [Object], required: false })
  departments?: any[];
}

export class EmployeeData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  currentLevel: number;

  @ApiProperty({ required: false })
  branchId?: string;

  @ApiProperty({ required: false })
  departmentId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  user?: {
    id: string;
    email: string;
    name?: string;
  };

  @ApiProperty({ required: false })
  branch?: {
    id: string;
    name: string;
    address?: string;
  };

  @ApiProperty({ type: [Object], required: false })
  tasks?: any[];

  @ApiProperty({ type: [Object], required: false })
  shiftSignups?: any[];
}
