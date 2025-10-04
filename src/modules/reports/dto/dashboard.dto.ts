import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class DashboardDto {
  @ApiProperty({
    description: 'Start date for the dashboard data (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the dashboard data (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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

export class DashboardStats {
  @ApiProperty()
  totalEmployees: number;

  @ApiProperty()
  totalBranches: number;

  @ApiProperty()
  totalDepartments: number;

  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  averageHoursPerEmployee: number;

  @ApiProperty()
  shiftUtilizationRate: number;

  @ApiProperty()
  attendanceRate: number;
}

export class RecentActivity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  employeeName?: string;

  @ApiProperty()
  branchName?: string;

  @ApiProperty()
  departmentName?: string;
}

export class TopPerformer {
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
}

export class ShiftTrend {
  @ApiProperty()
  date: string;

  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  utilizationRate: number;
}

export class DepartmentPerformance {
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

export class DashboardResponse {
  @ApiProperty()
  stats: DashboardStats;

  @ApiProperty()
  recentActivities: RecentActivity[];

  @ApiProperty()
  topPerformers: TopPerformer[];

  @ApiProperty()
  shiftTrends: ShiftTrend[];

  @ApiProperty()
  departmentPerformance: DepartmentPerformance[];

  @ApiProperty()
  generatedAt: Date;
}
