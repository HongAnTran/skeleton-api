import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsOptional } from 'class-validator';
export class UpdateShiftSlotDto {
  @ApiProperty({ example: 5, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  typeId?: string;
}
