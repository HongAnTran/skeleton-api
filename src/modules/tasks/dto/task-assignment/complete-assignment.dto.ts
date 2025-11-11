import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteAssignmentDto {
  @ApiProperty({ description: 'Ghi chú hoàn thành' })
  @IsOptional()
  @IsString()
  completedNote: string;
}
