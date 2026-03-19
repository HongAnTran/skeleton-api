import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Một item nhân viên trong response từ API Dahahi GetEmployeeList.
 * Chỉ khai báo các trường cần dùng; API có thể trả thêm trường khác.
 */
export class DahahiEmployeeItemDto {
  @ApiProperty({ description: 'ID nhân viên' })
  _id: string;

  @ApiProperty({ description: 'Trạng thái nhân viên (VD: Đang làm)' })
  StatusName: string;

  @ApiProperty({ description: 'Mã nhân viên' })
  EmployeeCode: string;

  @ApiProperty({ description: 'Họ tên' })
  Name: string;

  @ApiProperty({ description: 'Số điện thoại' })
  Mobile: string;

  @ApiProperty({ description: 'Email' })
  Email: string;

  @ApiProperty({ description: 'Địa chỉ' })
  Address: string;

  @ApiProperty({ description: 'Đã xóa hay chưa' })
  IsDeleted: boolean;

  @ApiProperty({ description: 'Người tạo (mã/SĐT)' })
  CreatedBy: string;

  @ApiProperty({ description: 'Mã trạng thái (1 = đang làm, ...)' })
  Status: number;

  @ApiProperty({ description: 'Ngày tạo (ISO 8601)' })
  CreatedDate: string;

  @ApiProperty({ description: 'URL ảnh đại diện' })
  Avatar: string;

  @ApiProperty({ description: 'Tên phòng ban cấu trúc (VD: Sau BH)' })
  StructureDepartmentName: string;
}

/**
 * Response từ API Dahahi GetEmployeeList.
 */
export class GetEmployeeListResponseDto {
  @ApiPropertyOptional({ description: 'Mã lỗi (null nếu thành công)' })
  ErrorCode: number | null;

  @ApiPropertyOptional({ description: 'Thông báo lỗi' })
  ErrorMessage: string;

  @ApiPropertyOptional({ description: 'Tổng số bản ghi' })
  Tota?: number;

  @ApiPropertyOptional({
    description: 'Danh sách nhân viên',
    type: [DahahiEmployeeItemDto],
  })
  Data: DahahiEmployeeItemDto[];
}
