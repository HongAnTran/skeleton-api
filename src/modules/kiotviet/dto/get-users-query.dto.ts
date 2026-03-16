import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Thời gian cập nhật (lọc user có lastModified >= giá trị này)',
    example: '2024-01-01T00:00:00',
  })
  @IsOptional()
  @IsDateString()
  lastModifiedFrom?: string;

  @ApiPropertyOptional({
    description: 'Số items trong 1 trang (mặc định 20, tối đa 100)',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 100;

  @ApiPropertyOptional({
    description: 'Vị trí item hiện tại (phân trang)',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentItem?: number = 0;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo trường (ví dụ: name, createdDate)',
    example: 'name',
  })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiPropertyOptional({
    description: 'Hướng sắp xếp: Asc (tăng dần, mặc định) hoặc Desc (giảm dần)',
    enum: ['Asc', 'Desc'],
  })
  @IsOptional()
  @IsString()
  orderDirection?: 'Asc' | 'Desc' = 'Asc';

  @ApiPropertyOptional({
    description:
      'Có lấy danh sách Id bị xoá dựa trên lastModifiedFrom hay không',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeRemoveIds?: boolean = false;
}
