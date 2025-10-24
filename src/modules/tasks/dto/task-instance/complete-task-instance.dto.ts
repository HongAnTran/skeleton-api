import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CompleteTaskInstanceDto {
  @ApiProperty({
    required: false,
    description: 'Note khi hoàn thành task',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
