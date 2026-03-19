import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetCheckinHistoryDto {
  @ApiProperty({
    description: 'Mã nhân viên (Dahahi)',
    example: 'EMP0000035',
  })
  @IsString()
  EmployeeCode: string;

  @ApiProperty({
    description: 'Thời điểm bắt đầu (định dạng DD/MM/YYYY HH:mm:ss)',
    example: '19/03/2026 00:00:00',
  })
  @IsString()
  FromTimeStr: string;

  @ApiProperty({
    description: 'Thời điểm kết thúc (định dạng DD/MM/YYYY HH:mm:ss)',
    example: '19/03/2026 23:59:59',
  })
  @IsString()
  ToTimeStr: string;
}
