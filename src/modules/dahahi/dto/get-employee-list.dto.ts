import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetEmployeeListDto {
  @ApiPropertyOptional({
    description: 'Tên nhân viên (tìm kiếm theo tên)',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  FullName?: string;

  @ApiPropertyOptional({
    description: 'Chỉ số trang (bắt đầu từ 0 hoặc 1 tùy API)',
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  PageIndex: number = 1;

  @ApiPropertyOptional({
    description: 'Số bản ghi mỗi trang',
    default: 20,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  PageSize: number = 20;
}
