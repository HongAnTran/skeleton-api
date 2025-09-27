import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ShiftSignupStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({
    enum: ShiftSignupStatus,
    example: ShiftSignupStatus.CONFIRMED,
  })
  @IsEnum(ShiftSignupStatus)
  status: ShiftSignupStatus;
}
