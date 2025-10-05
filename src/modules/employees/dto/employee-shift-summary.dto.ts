import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { Employee } from '../entities/employee.entity';

export class EmployeeShiftSummaryDto {
  @ApiProperty({
    description: 'Ngày bắt đầu để lọc ca làm việc (định dạng ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc để lọc ca làm việc (định dạng ISO 8601)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsDateString()
  endDate: string;
}

export class ShiftSignupSummary {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  slotId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  slot: {
    id: string;
    date: Date;
    capacity: number;
    note?: string;
    branch: {
      id: string;
      name: string;
    };
    department: {
      id: string;
      name: string;
    };
    type: {
      id: string;
      name: string;
    };
  };
}

export class EmployeeShiftSummaryResponse {
  @ApiProperty()
  employee: Employee;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  shiftCount: number;

  @ApiProperty({ type: [ShiftSignupSummary] })
  shifts: ShiftSignupSummary[];
}
