import { ApiProperty } from '@nestjs/swagger';

export class Branch {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  user?: any;

  @ApiProperty({ required: false, type: [Object] })
  employees?: any[];

  @ApiProperty({ required: false, type: [Object] })
  shiftSlots?: any[];
}
