import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

export class QueryShiftSlotEmployeeDto {
  @ApiPropertyOptional({
    description: 'ID loại ca làm việc để lọc',
  })
  @IsOptional()
  @IsString()
  typeId?: string;

  @ApiPropertyOptional({
    description: 'ID phòng ban để lọc',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

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
    description: 'Đã hủy để lọc',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCanceled?: boolean;
}
