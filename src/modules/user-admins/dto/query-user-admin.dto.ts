import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class QueryUserAdminDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}
