import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { TaskScope } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryTaskTemplateDto {
  @ApiProperty({ enum: TaskScope, required: false })
  @IsOptional()
  @IsEnum(TaskScope)
  scope?: TaskScope;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
