import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'clxxx123456789' })
  @IsString()
  departmentId: string;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  level: number;

  @ApiProperty({ example: 'Complete monthly sales target' })
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isTaskTeam?: boolean;
}
