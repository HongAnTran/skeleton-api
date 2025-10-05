import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class EmployeeReportDto {
  @ApiProperty({
    description: 'Ngày bắt đầu cho báo cáo (định dạng ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc cho báo cáo (định dạng ISO 8601)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'ID chi nhánh để lọc',
    required: false,
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({
    description: 'ID phòng ban để lọc',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class EmployeeReportResponse {
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
