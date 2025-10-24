import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ApproveTaskInstanceDto {
  @ApiProperty({
    example: 'clxxx123456789',
    description: 'ID of user who approved the task',
  })
  @IsString()
  approvedBy: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
