import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KiotVietUserDto {
  @ApiProperty({ description: 'ID người dùng' })
  id: number;

  @ApiProperty({ description: 'Tên đăng nhập' })
  userName: string;

  @ApiProperty({ description: 'Họ tên' })
  givenName: string;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  address?: string;

  @ApiPropertyOptional({ description: 'Điện thoại' })
  mobilePhone?: string;

  @ApiPropertyOptional({ description: 'Email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Ghi chú' })
  description?: string;

  @ApiProperty({ description: 'Id cửa hàng' })
  retailerId: number;

  @ApiPropertyOptional({ description: 'Ngày sinh' })
  birthDate?: string;

  @ApiProperty({ description: 'Ngày tạo' })
  createdDate: string;
}

export class GetUsersResponseDto {
  @ApiProperty({ description: 'Tổng số bản ghi' })
  total: number;

  @ApiProperty({ description: 'Số items trong trang' })
  pageSize: number;

  @ApiProperty({
    description: 'Danh sách người dùng (đã xác nhận, không bao gồm Super Admin)',
    type: [KiotVietUserDto],
  })
  data: KiotVietUserDto[];

  @ApiPropertyOptional({
    description:
      'Danh sách ID người dùng bị xóa/ngừng hoạt động (khi includeRemoveIds=true)',
    type: [Number],
  })
  removeIds?: number[];
}
