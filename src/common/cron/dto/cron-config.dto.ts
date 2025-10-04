import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class CronConfigDto {
  @ApiProperty({
    description: 'Enable automatic shift signup status updates',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableShiftSignupUpdates?: boolean = true;

  @ApiProperty({
    description: 'Enable cleanup of old completed shift signups',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableCleanup?: boolean = true;

  @ApiProperty({
    description: 'Enable upcoming shifts notifications',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableUpcomingNotifications?: boolean = true;

  @ApiProperty({
    description: 'Days to keep completed shift signups before cleanup',
    default: 90,
  })
  @IsOptional()
  @IsString()
  cleanupDays?: string = '90';

  @ApiProperty({
    description: 'Cron expression for shift signup updates',
    default: '0 2 * * *', // Every day at 2 AM
  })
  @IsOptional()
  @IsString()
  updateCronExpression?: string = '0 2 * * *';

  @ApiProperty({
    description: 'Cron expression for cleanup',
    default: '0 3 * * *', // Every day at 3 AM
  })
  @IsOptional()
  @IsString()
  cleanupCronExpression?: string = '0 3 * * *';

  @ApiProperty({
    description: 'Cron expression for upcoming shifts check',
    default: '0 * * * *', // Every hour
  })
  @IsOptional()
  @IsString()
  upcomingCronExpression?: string = '0 * * * *';
}
