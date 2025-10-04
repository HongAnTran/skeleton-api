import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { ShiftSwapStatus } from '../entities/shift-swap-request.entity';

export class QueryShiftSwapRequestDto extends PaginationDto {
  @ApiProperty({
    description: 'Lọc theo type',
  })
  @IsNotEmpty()
  @IsEnum(['sent', 'received'])
  type: 'sent' | 'received';

  @ApiProperty({
    enum: ShiftSwapStatus,
    description: 'Lọc theo trạng thái',
    required: false,
  })
  @IsOptional()
  @IsEnum(ShiftSwapStatus)
  status?: ShiftSwapStatus;

  @ApiProperty({
    description: 'Lọc theo ID người yêu cầu',
    required: false,
  })
  @IsOptional()
  @IsString()
  requesterId?: string;

  @ApiProperty({
    description: 'Lọc theo ID người đích',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiProperty({
    description: 'Tìm kiếm theo lý do hoặc tin nhắn',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
