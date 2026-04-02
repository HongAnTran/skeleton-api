import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Đối tác vận chuyển (Webhook invoice.update). */
export class KiotVietWebhookPartnerDeliveryDto {
  @ApiProperty()
  Code: string;

  @ApiProperty()
  Name: string;

  @ApiProperty()
  ContactNumber: string;

  @ApiProperty()
  Address: string;

  @ApiProperty()
  Email: string;
}

/** Giao hàng hóa đơn. */
export class KiotVietWebhookInvoiceDeliveryDto {
  @ApiProperty()
  DeliveryCode: string;

  @ApiProperty({
    description:
      '1: chưa giao hàng, 2: đang giao hàng, 3: đã giao hàng, 4: đang chuyển hoàn, 5: đã chuyển hoàn, 6: đã hủy',
    example: 1,
  })
  Status: number;

  @ApiProperty()
  StatusValue: string;

  @ApiPropertyOptional()
  Type?: number;

  @ApiPropertyOptional()
  Price?: number;

  @ApiProperty()
  Receiver: string;

  @ApiProperty()
  ContactNumber: string;

  @ApiProperty()
  Address: string;

  @ApiPropertyOptional()
  LocationId?: number;

  @ApiProperty()
  LocationName: string;

  @ApiPropertyOptional()
  Weight?: number;

  @ApiPropertyOptional()
  Length?: number;

  @ApiPropertyOptional()
  Width?: number;

  @ApiPropertyOptional()
  Height?: number;

  @ApiPropertyOptional()
  PartnerDeliveryId?: number;

  @ApiPropertyOptional({ type: KiotVietWebhookPartnerDeliveryDto })
  PartnerDelivery?: KiotVietWebhookPartnerDeliveryDto;
}

/** Dòng hàng trên hóa đơn. */
export class KiotVietWebhookInvoiceDetailDto {
  @ApiProperty()
  ProductId: number;

  @ApiProperty()
  ProductCode: string;

  @ApiProperty()
  ProductName: string;

  @ApiProperty()
  Quantity: number;

  @ApiProperty()
  Price: number;

  @ApiPropertyOptional()
  Discount?: number;

  @ApiPropertyOptional()
  DiscountRatio?: number;
}

/** Thanh toán. */
export class KiotVietWebhookPaymentDto {
  @ApiProperty()
  Id: number;

  @ApiProperty()
  Code: string;

  @ApiProperty()
  Amount: number;

  @ApiPropertyOptional()
  AccountId?: number;

  @ApiProperty()
  BankAccount: string;

  @ApiProperty()
  Description: string;

  @ApiProperty()
  Method: string;

  @ApiPropertyOptional()
  Status?: number;

  @ApiPropertyOptional()
  StatusValue?: string;

  @ApiProperty({ description: 'DateTime (ISO 8601)', example: '2025-01-15T10:30:00' })
  TransDate: string;
}

/** Một hóa đơn trong mảng Data (Action invoice.update). */
export class KiotVietWebhookInvoiceDataDto {
  @ApiProperty()
  Id: number;

  @ApiProperty()
  Code: string;

  @ApiProperty({ description: 'DateTime (ISO 8601)', example: '2025-01-15T10:30:00' })
  PurchaseDate: string;

  @ApiProperty()
  BranchId: number;

  @ApiProperty()
  BranchName: string;

  @ApiProperty()
  SoldById: number;

  @ApiProperty()
  SoldByName: string;

  @ApiPropertyOptional()
  CustomerId?: number;

  @ApiProperty()
  CustomerCode: string;

  @ApiProperty()
  CustomerName: string;

  @ApiProperty({ description: 'Decimal → number' })
  Total: number;

  @ApiProperty({ description: 'Decimal → number' })
  TotalPayment: number;

  @ApiPropertyOptional()
  Discount?: number;

  @ApiPropertyOptional()
  DiscountRatio?: number;

  @ApiProperty({
    description:
      '1: hoàn thành, 2: đã hủy, 3: đang xử lý, 5: không giao được',
    example: 1,
  })
  Status: number;

  @ApiProperty()
  StatusValue: string;

  @ApiProperty()
  Description: string;

  @ApiProperty()
  UsingCod: boolean;

  @ApiPropertyOptional({ description: 'DateTime (ISO 8601)' })
  ModifiedDate?: string;

  @ApiPropertyOptional({ type: KiotVietWebhookInvoiceDeliveryDto })
  InvoiceDelivery?: KiotVietWebhookInvoiceDeliveryDto;

  @ApiProperty({ type: [KiotVietWebhookInvoiceDetailDto] })
  InvoiceDetails: KiotVietWebhookInvoiceDetailDto[];

  @ApiProperty({ type: [KiotVietWebhookPaymentDto] })
  Payments: KiotVietWebhookPaymentDto[];
}

export class KiotVietWebhookNotificationDto {
  @ApiProperty({ example: 'invoice.update' })
  Action: string;

  @ApiProperty({ type: [KiotVietWebhookInvoiceDataDto] })
  Data: KiotVietWebhookInvoiceDataDto[];
}

export class KiotVietWebhookExampleDto {
  @ApiProperty({ description: 'Id gói webhook' })
  Id: string;

  @ApiProperty({ example: 1 })
  Attempt: number;

  @ApiProperty({ type: [KiotVietWebhookNotificationDto] })
  Notifications: KiotVietWebhookNotificationDto[];
}
