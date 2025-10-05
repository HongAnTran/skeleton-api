import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class CronConfigDto {
  @ApiProperty({
    description: 'Bật cập nhật trạng thái đăng ký ca tự động',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableShiftSignupUpdates?: boolean = true;

  @ApiProperty({
    description: 'Bật dọn dẹp các đăng ký ca đã hoàn thành cũ',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableCleanup?: boolean = true;

  @ApiProperty({
    description: 'Bật thông báo ca sắp tới',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableUpcomingNotifications?: boolean = true;

  @ApiProperty({
    description: 'Số ngày giữ các đăng ký ca đã hoàn thành trước khi dọn dẹp',
    default: 90,
  })
  @IsOptional()
  @IsString()
  cleanupDays?: string = '90';

  @ApiProperty({
    description: 'Biểu thức cron cho cập nhật đăng ký ca',
    default: '0 2 * * *', // Every day at 2 AM
  })
  @IsOptional()
  @IsString()
  updateCronExpression?: string = '0 2 * * *';

  @ApiProperty({
    description: 'Biểu thức cron cho dọn dẹp',
    default: '0 3 * * *', // Every day at 3 AM
  })
  @IsOptional()
  @IsString()
  cleanupCronExpression?: string = '0 3 * * *';

  @ApiProperty({
    description: 'Biểu thức cron cho kiểm tra ca sắp tới',
    default: '0 * * * *', // Every hour
  })
  @IsOptional()
  @IsString()
  upcomingCronExpression?: string = '0 * * * *';
}
