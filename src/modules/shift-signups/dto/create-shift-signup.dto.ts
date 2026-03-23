import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateShiftSignupDto {
  @ApiProperty()
  @IsString()
  slotId: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  employeeId?: string;
}
