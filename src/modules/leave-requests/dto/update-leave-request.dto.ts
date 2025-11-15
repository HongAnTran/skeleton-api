import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { LeaveRequestStatus } from '@prisma/client';

export class UpdateLeaveRequestDto {
  @ApiProperty({
    description: 'Lý do từ chối (bắt buộc nếu reject)',
    required: false,
    example: 'Không đủ số ngày nghỉ phép',
  })
  @IsOptional()
  @IsString()
  rejectedReason?: string;
}

export class ApproveLeaveRequestDto {
  @ApiProperty({
    description: 'ID của người duyệt',
    example: 'clx1234567890',
  })
  @IsString()
  approvedBy: string;
}

export class RejectLeaveRequestDto {
  @ApiProperty({
    description: 'Lý do từ chối',
    example: 'Không đủ số ngày nghỉ phép',
  })
  @IsString()
  rejectedReason: string;

  @ApiProperty({
    description: 'ID của người từ chối',
    example: 'clx1234567890',
  })
  @IsString()
  rejectedBy: string;
}

export class CancelLeaveRequestDto {
  @ApiProperty({
    description: 'Lý do hủy',
    example: 'Thay đổi kế hoạch',
  })
  @IsString()
  cancelReason: string;
}
