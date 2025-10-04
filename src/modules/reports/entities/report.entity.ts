import { ApiProperty } from '@nestjs/swagger';

export class EmployeeReport {
  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  employeeName: string;

  @ApiProperty()
  branchName: string;

  @ApiProperty()
  departmentName: string;

  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  averageHoursPerShift: number;

  @ApiProperty()
  shifts: any[];
}

export class ShiftReport {
  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  totalCapacity: number;

  @ApiProperty()
  totalSignups: number;

  @ApiProperty()
  utilizationRate: number;

  @ApiProperty()
  shifts: any[];
}

export class DepartmentReport {
  @ApiProperty()
  departmentId: string;

  @ApiProperty()
  departmentName: string;

  @ApiProperty()
  branchName: string;

  @ApiProperty()
  totalEmployees: number;

  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  averageHoursPerEmployee: number;

  @ApiProperty()
  utilizationRate: number;
}

export class AttendanceReport {
  @ApiProperty()
  totalEmployees: number;

  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  averageAttendanceRate: number;

  @ApiProperty()
  attendanceByDay: any[];

  @ApiProperty()
  attendanceByEmployee: any[];
}
