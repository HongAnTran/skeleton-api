import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class DepartmentReportDto {
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
}

export class DepartmentReportResponse {
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
