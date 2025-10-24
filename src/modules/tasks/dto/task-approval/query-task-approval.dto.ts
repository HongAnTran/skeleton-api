import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryTaskApprovalDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instanceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  actedBy?: string;
}
