import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class CreateBulkShiftSignupDto {
  @ApiProperty({
    description: 'Danh sách ID các ca muốn đăng ký',
    example: ['slot1', 'slot2', 'slot3'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 ca để đăng ký' })
  @IsString({ each: true })
  slotIds: string[];
}