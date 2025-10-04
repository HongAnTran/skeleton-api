import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class QueryShiftSignupEmployeeDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Employee ID to filter by',
    example: '123',
  })
  @IsNotEmpty()
  @IsString()
  employeeId: string;
}
