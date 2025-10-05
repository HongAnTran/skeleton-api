import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';
export class UpdateShiftSlotDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ example: 5, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  typeId?: string;
}
