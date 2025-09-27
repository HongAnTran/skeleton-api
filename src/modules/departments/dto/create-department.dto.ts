import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'Human Resources' })
  @IsString()
  name: string;
}
