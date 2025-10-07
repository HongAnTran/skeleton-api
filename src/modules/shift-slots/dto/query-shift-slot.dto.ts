import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

export class QueryShiftSlotDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'ID chi nhánh để lọc',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'ID phòng ban để lọc',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'ID loại ca làm việc để lọc',
  })
  @IsOptional()
  @IsString()
  typeId?: string;

  @ApiPropertyOptional({
    description: 'Ngày bắt đầu để lọc (chuỗi ISO)',
    example: '2025-08-31T17:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Ngày kết thúc để lọc (chuỗi ISO)',
    example: '2025-09-30T16:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'ID nhân viên để lọc',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;
}
