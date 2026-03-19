import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Một item nhân viên trong response từ API Dahahi GetEmployeeList.
 * Chỉ khai báo các trường cần dùng; API có thể trả thêm trường khác.
 */
export class DahahiEmployeeItemDto {
  @ApiPropertyOptional({ description: 'Trạng thái nhân viên (VD: Đang làm)' })
  StatusName?: string;

  @ApiPropertyOptional({ description: 'Mã nhân viên' })
  EmployeeCode?: string;

  @ApiPropertyOptional({ description: 'Họ tên' })
  Name?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  Mobile?: string;

  @ApiPropertyOptional({ description: 'Email' })
  Email?: string | null;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  Address?: string | null;

  @ApiPropertyOptional({ description: 'Đã xóa hay chưa' })
  IsDeleted?: boolean;

  @ApiPropertyOptional({ description: 'Người tạo (mã/SĐT)' })
  CreatedBy?: string;

  @ApiPropertyOptional({ description: 'Mã trạng thái (1 = đang làm, ...)' })
  Status?: number;

  @ApiPropertyOptional({ description: 'Ngày tạo (ISO 8601)' })
  CreatedDate?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  Avatar?: string | null;

  @ApiPropertyOptional({ description: 'Tên phòng ban cấu trúc (VD: Sau BH)' })
  StructureDepartmentName?: string | null;
}

/**
 * Response từ API Dahahi GetEmployeeList.
 */
export class GetEmployeeListResponseDto {
  @ApiPropertyOptional({ description: 'Mã lỗi (null nếu thành công)' })
  ErrorCode?: number | null;

  @ApiPropertyOptional({ description: 'Thông báo lỗi' })
  ErrorMessage?: string;

  @ApiPropertyOptional({ description: 'Tổng số bản ghi' })
  Total?: number;

  @ApiPropertyOptional({
    description: 'Danh sách nhân viên',
    type: [DahahiEmployeeItemDto],
  })
  Data?: DahahiEmployeeItemDto[];
}
