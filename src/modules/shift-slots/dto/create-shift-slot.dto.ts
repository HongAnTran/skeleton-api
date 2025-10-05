import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateShiftSlotDto {
  @ApiProperty()
  @IsString()
  branchId: string;

  @ApiProperty()
  @IsArray()
  departmentIds: string[];

  @ApiProperty({ example: 5, minimum: 1 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @IsArray()
  typeIds: string[];
}
