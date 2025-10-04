import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: 'local', required: false })
  @IsOptional()
  @IsString()
  provider?: string;
}
