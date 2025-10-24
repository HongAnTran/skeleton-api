import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RejectTaskInstanceDto {
  @ApiProperty({
    example: 'clxxx123456789',
    description: 'ID of user who rejected the task',
  })
  @IsString()
  rejectedBy: string;

  @ApiProperty({ example: 'Does not meet quality standards' })
  @IsString()
  rejectedReason: string;
}
