import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

export class QueryShiftSlotEmployeeDto {
  @ApiPropertyOptional({
    description: 'Shift slot type ID to filter by',
  })
  @IsOptional()
  @IsString()
  typeId?: string;

  @ApiPropertyOptional({
    description: 'Department ID to filter by',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Start date for filtering (ISO string)',
    example: '2025-08-31T17:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (ISO string)',
    example: '2025-09-30T16:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Is canceled for filtering',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCanceled?: boolean;
}
