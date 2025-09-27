import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ShiftSignupStatus } from '@prisma/client';

export class CreateShiftSignupDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  employeeId: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  slotId: string;

  @ApiProperty({
    enum: ShiftSignupStatus,
    example: ShiftSignupStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(ShiftSignupStatus)
  status?: ShiftSignupStatus;
}
