import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class QueryShiftSignupEmployeeDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Employee ID to filter by',
    example: '123',
  })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiPropertyOptional({
    description: 'Start date from to filter by',
    example: '2025-08-31T17:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
