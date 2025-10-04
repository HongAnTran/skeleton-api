import { Module } from '@nestjs/common';
import { ShiftSignupCronService } from './shift-signup-cron.service';
import { CronController } from './cron.controller';

@Module({
  providers: [ShiftSignupCronService],
  controllers: [CronController],
  exports: [ShiftSignupCronService],
})
export class CronModule {}
