import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  EmployeeReportDto,
  EmployeeReportResponse,
} from './dto/employee-report.dto';
import { ShiftReportDto, ShiftReportResponse } from './dto/shift-report.dto';
import {
  DepartmentReportDto,
  DepartmentReportResponse,
} from './dto/department-report.dto';
import {
  AttendanceReportDto,
  AttendanceReportResponse,
} from './dto/attendance-report.dto';
import { DashboardDto, DashboardResponse } from './dto/dashboard.dto';
import { JwtPayload, User } from 'src/common/decorators/user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('employees')
  @ApiOperation({
    summary: 'Get employee performance report',
    description:
      'Get detailed report of employee performance including shifts and hours worked',
  })
  @ApiResponse({
    status: 200,
    type: [EmployeeReportResponse],
    description: 'Employee performance report',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for the report (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date for the report (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filter by branch ID',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: String,
    description: 'Filter by department ID',
  })
  async getEmployeeReport(
    @User() user: JwtPayload,
    @Query() queryDto: EmployeeReportDto,
  ) {
    return this.reportsService.getEmployeeReport(queryDto);
  }

  @Get('shifts')
  @ApiOperation({
    summary: 'Get shift utilization report',
    description:
      'Get report of shift utilization including capacity and signup rates',
  })
  @ApiResponse({
    status: 200,
    type: ShiftReportResponse,
    description: 'Shift utilization report',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for the report (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date for the report (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filter by branch ID',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: String,
    description: 'Filter by department ID',
  })
  async getShiftReport(
    @User() user: JwtPayload,
    @Query() queryDto: ShiftReportDto,
  ) {
    return this.reportsService.getShiftReport(queryDto);
  }

  @Get('departments')
  @ApiOperation({
    summary: 'Get department performance report',
    description:
      'Get report of department performance including employee statistics',
  })
  @ApiResponse({
    status: 200,
    type: [DepartmentReportResponse],
    description: 'Department performance report',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for the report (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date for the report (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filter by branch ID',
  })
  async getDepartmentReport(
    @User() user: JwtPayload,
    @Query() queryDto: DepartmentReportDto,
  ) {
    return this.reportsService.getDepartmentReport(queryDto);
  }

  @Get('attendance')
  @ApiOperation({
    summary: 'Get attendance report',
    description:
      'Get comprehensive attendance report including daily and employee statistics',
  })
  @ApiResponse({
    status: 200,
    type: AttendanceReportResponse,
    description: 'Attendance report',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for the report (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date for the report (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filter by branch ID',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: String,
    description: 'Filter by department ID',
  })
  async getAttendanceReport(
    @User() user: JwtPayload,
    @Query() queryDto: AttendanceReportDto,
  ) {
    return this.reportsService.getAttendanceReport(queryDto);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Get overall summary report',
    description: 'Get a comprehensive summary of all key metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Overall summary report',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for the report (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date for the report (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filter by branch ID',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: String,
    description: 'Filter by department ID',
  })
  async getSummaryReport(
    @User() user: JwtPayload,
    @Query() queryDto: EmployeeReportDto,
  ) {
    const [employeeReport, shiftReport, departmentReport, attendanceReport] =
      await Promise.all([
        this.reportsService.getEmployeeReport(queryDto),
        this.reportsService.getShiftReport(queryDto),
        this.reportsService.getDepartmentReport(queryDto),
        this.reportsService.getAttendanceReport(queryDto),
      ]);

    return {
      summary: {
        totalEmployees: attendanceReport.totalEmployees,
        totalShifts: shiftReport.totalShifts,
        totalHours: attendanceReport.totalHours,
        averageAttendanceRate: attendanceReport.averageAttendanceRate,
        shiftUtilizationRate: shiftReport.utilizationRate,
      },
      employeeReport,
      shiftReport,
      departmentReport,
      attendanceReport,
    };
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard data',
    description:
      'Get comprehensive dashboard data with key metrics, recent activities, and performance insights',
  })
  @ApiResponse({
    status: 200,
    type: DashboardResponse,
    description: 'Dashboard data with comprehensive metrics',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description:
      'Start date for the dashboard data (ISO 8601 format). Defaults to 30 days ago',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description:
      'End date for the dashboard data (ISO 8601 format). Defaults to today',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    type: String,
    description: 'Filter by branch ID',
  })
  @ApiQuery({
    name: 'departmentId',
    required: false,
    type: String,
    description: 'Filter by department ID',
  })
  async getDashboard(
    @User() user: JwtPayload,
    @Query() queryDto: DashboardDto,
  ) {
    return this.reportsService.getDashboardData(queryDto);
  }
}
