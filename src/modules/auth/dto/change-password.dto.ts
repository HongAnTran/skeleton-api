import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'oldPassword123',
    description: 'Mật khẩu hiện tại',
  })
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Mật khẩu mới',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
