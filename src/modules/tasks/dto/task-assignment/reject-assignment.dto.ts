import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectAssignmentDto {
  @ApiProperty({ description: 'Lý do reject' })
  @IsString()
  rejectedReason: string;
}
