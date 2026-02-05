import { ApiProperty } from '@nestjs/swagger';

export class UserAdmin {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  user?: any;

  @ApiProperty({ required: false })
  account?: any;
}
