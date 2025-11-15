import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { LeaveRequestStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

export class QueryLeaveRequestDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'ID nhân viên',
    example: 'clx1234567890',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái đơn xin nghỉ',
    enum: LeaveRequestStatus,
  })
  @IsOptional()
  @IsEnum(LeaveRequestStatus)
  status?: LeaveRequestStatus;

  @ApiPropertyOptional({
    description: 'Ngày bắt đầu (từ ngày)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Ngày kết thúc (đến ngày)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDateTo?: string;
}
