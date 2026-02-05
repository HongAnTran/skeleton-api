import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserAdminDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsString()
  email: string;

  @ApiProperty({
    example: 'admin_user123',
    required: false,
    description:
      'Tên người dùng phải có từ 3-20 ký tự, chỉ chứa chữ cái, số và các ký tự đặc biệt cơ bản',
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Tên người dùng phải có ít nhất 3 ký tự' })
  @MaxLength(20, { message: 'Tên người dùng không được vượt quá 20 ký tự' })
  @Matches(/^[a-zA-Z0-9_.\-@#$%&*+=?!~^|\\/<>\[\]{}()]+$/, {
    message:
      'Tên người dùng chỉ có thể chứa chữ cái, số và các ký tự đặc biệt cơ bản',
  })
  username: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  password: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'local', required: false })
  @IsOptional()
  @IsString()
  provider?: string;
}
