import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class AttendanceReportDto {
  @ApiProperty({
    description: 'Start date for the report (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for the report (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Branch ID to filter by',
    required: false,
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({
    description: 'Department ID to filter by',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class AttendanceReportResponse {
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
