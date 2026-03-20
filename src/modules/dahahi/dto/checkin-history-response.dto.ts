import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Một bản ghi check-in trả về cho FE (sau khi map từ API Dahahi).
 */
export class DahahiCheckinHistoryItemDto {
  @ApiProperty({
    description: 'Mã nhân diện khuôn mặt (API gốc typo FacePersionId)',
  })
  FacePersionId: string;

  @ApiProperty({ description: 'Thời gian check-in (chuỗi từ Dahahi)' })
  CheckinTimeStr: string;

  @ApiProperty({ description: 'ID khuôn mặt trên thiết bị' })
  FaceId: string;

  @ApiPropertyOptional({ description: 'ID nhân viên (Dahahi)' })
  EmployeeIdStr: string;

  @ApiProperty({ description: 'Mã nhân viên' })
  EmployeeCode: string;

  @ApiProperty({ description: 'Tên nhân viên' })
  EmployeeName: string;

  @ApiProperty({ description: 'Mã nhân diện người (chuẩn)' })
  FacePersonId: string;

  @ApiProperty({ description: 'Thời gian check-in (định dạng chuẩn hơn)' })
  CheckinTime1Str: string;

  @ApiProperty({
    description: 'URL ảnh chụp lúc check-in (đã ghép base Dahahi)',
  })
  LiveImageUrl: string;
}

/**
 * Response thô từ API Dahahi POST /api/facereg/checkinhis
 */
export class GetCheckinHistoryResponseDto {
  @ApiProperty({ description: 'Mã lỗi (VD: 000000 = thành công)' })
  ErrorCode: string | null;

  @ApiProperty({ description: 'Thông báo' })
  ErrorMessage: string;

  @ApiProperty({ description: 'Tổng số bản ghi' })
  Total: number;

  @ApiProperty({
    description: 'Danh sách lượt check-in',
    type: [DahahiCheckinHistoryItemDto],
  })
  Data: DahahiCheckinHistoryItemDto[];

  @ApiPropertyOptional({ description: 'Mở rộng' })
  Extension?: unknown;
}

/**
 * Báo cáo tổng hợp từ lịch sử check-in (không có dữ liệu check-out từ Dahahi).
 */
export class DahahiCheckinHistoryReportDto {
  @ApiProperty({
    description:
      'Tổng số giờ công (ước lượng): cộng dồn mỗi ngày (lần check-in muộn nhất − lần sớm nhất trong ngày). Ngày chỉ 1 lần chấm → 0 giờ theo công thức này.',
    example: 42.5,
  })
  totalWorkHours: number;

  @ApiProperty({
    description:
      'Danh sách ngày quên checkout (YYYY-MM-DD): ngày có >1 cụm check-in (hai lần cách nhau > 2 phút, gom như trùng máy không tính).',
    type: [String],
    example: ['2026-03-15', '2026-03-18'],
  })
  forgotCheckoutDates: string[];

  @ApiProperty({
    description: 'Tổng số bản ghi check-in trả về (đã map URL ảnh)',
  })
  totalRecords: number;
}

/**
 * Response API: danh sách check-in + báo cáo giờ công / ngày quên check-out.
 */
export class GetCheckinHistoryWithReportDto {
  @ApiProperty({
    type: [DahahiCheckinHistoryItemDto],
    description:
      'Toàn bộ bản ghi check-in trong khoảng thời gian (đã phân trang hết phía server)',
  })
  data: DahahiCheckinHistoryItemDto[];

  @ApiProperty({
    type: DahahiCheckinHistoryReportDto,
    description: 'Báo cáo tổng hợp',
  })
  report: DahahiCheckinHistoryReportDto;
}
