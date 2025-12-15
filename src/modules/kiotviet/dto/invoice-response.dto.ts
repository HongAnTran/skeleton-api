import { ApiProperty } from '@nestjs/swagger';
import { WarrantyInfoDto } from './warranty.dto';

export class InvoiceProductDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  productId: number;

  @ApiProperty({ description: 'Tên sản phẩm' })
  productName: string;

  @ApiProperty({ description: 'Mã sản phẩm' })
  productCode: string;

  @ApiProperty({ description: 'Số lượng' })
  quantity: number;

  @ApiProperty({ description: 'Giá bán' })
  price: number;

  @ApiProperty({ description: 'Thành tiền' })
  subTotal: number;

  @ApiProperty({ description: 'Serial/IMEI', required: false })
  serialNumbers?: string[];
}

export class InvoiceCustomerDto {
  @ApiProperty({ description: 'ID khách hàng' })
  id: number;

  @ApiProperty({ description: 'Tên khách hàng' })
  name: string;

  @ApiProperty({ description: 'Số điện thoại', required: false })
  contactNumber?: string;

  @ApiProperty({ description: 'Email', required: false })
  email?: string;
}

export class InvoiceResponseDto {
  @ApiProperty({ description: 'ID hóa đơn' })
  id: number;

  @ApiProperty({ description: 'Mã hóa đơn' })
  code: string;

  @ApiProperty({ description: 'Ngày tạo' })
  createdDate: string;

  @ApiProperty({ description: 'Tổng tiền' })
  total: number;

  @ApiProperty({ description: 'Tổng tiền sau giảm giá' })
  totalPayment: number;

  @ApiProperty({ description: 'Trạng thái', required: false })
  status?: number;

  @ApiProperty({
    description: 'Thông tin khách hàng',
    type: InvoiceCustomerDto,
  })
  customerId: number;
  @ApiProperty({ description: 'Mã khách hàng' })
  customerCode: string;
  @ApiProperty({ description: 'Tên khách hàng' })
  customerName: string;

  @ApiProperty({
    description: 'Danh sách sản phẩm',
    type: [InvoiceProductDto],
  })
  invoiceDetails: InvoiceProductDto[];

  @ApiProperty({ description: 'Ghi chú', required: false })
  note?: string;

  @ApiProperty({
    description: 'Thông tin bảo hành',
    type: WarrantyInfoDto,
    required: false,
  })
  warranty?: WarrantyInfoDto;
}
