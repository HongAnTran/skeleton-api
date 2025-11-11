import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignEmployeesToCycleDto {
  @ApiProperty({ description: 'ID của TaskCycle' })
  @IsString()
  cycleId: string;

  @ApiProperty({
    description: 'Danh sách employeeIds (nếu có)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];

  @ApiProperty({
    description: 'ID của Department để gán tất cả nhân viên trong phòng ban',
    required: false,
  })
  @IsOptional()
  @IsString()
  departmentId?: string;
}
