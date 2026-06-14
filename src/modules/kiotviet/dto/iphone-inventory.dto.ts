import { ApiProperty } from '@nestjs/swagger';
import { IphoneMarketTotalsDto } from './get-invoices-by-user.dto';

export class IphoneInventoryDetailRowDto {
  @ApiProperty({ example: 'iPhone 16 Pro Max' })
  modelName: string;

  @ApiProperty({ example: '256GB' })
  storage: string;

  @ApiProperty({ example: 'Desert Titanium' })
  color: string;

  @ApiProperty({
    description: 'lock | international | unknown',
    example: 'lock',
  })
  marketType: string;

  @ApiProperty({
    description: 'Nhóm hàng gốc từ KiotViet (nếu có)',
    required: false,
  })
  productGroup?: string;

  @ApiProperty({ description: 'Số lượng tồn kho (onHand)' })
  onHand: number;
}

export class IphoneInventoryBranchDto {
  @ApiProperty({ description: 'ID chi nhánh' })
  branchId: number;

  @ApiProperty({ description: 'Tên chi nhánh' })
  branchName: string;

  @ApiProperty({ description: 'Tổng tồn kho iPhone của chi nhánh' })
  totalOnHand: number;

  @ApiProperty({ type: IphoneMarketTotalsDto })
  byMarket: IphoneMarketTotalsDto;

  @ApiProperty({
    description: 'Chi tiết tồn theo model + bộ nhớ + màu + loại Lock/QT',
    type: [IphoneInventoryDetailRowDto],
  })
  detailRows: IphoneInventoryDetailRowDto[];
}

export class IphoneInventoryReportDto {
  @ApiProperty({ description: 'Tổng tồn kho iPhone tất cả chi nhánh' })
  totalOnHand: number;

  @ApiProperty({
    description: 'Tồn kho iPhone chia theo từng chi nhánh',
    type: [IphoneInventoryBranchDto],
  })
  byBranch: IphoneInventoryBranchDto[];
}
