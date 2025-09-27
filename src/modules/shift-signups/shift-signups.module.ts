import { Module } from '@nestjs/common';
import { ShiftSignupsController } from './shift-signups.controller';
import { ShiftSignupsService } from './shift-signups.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ShiftSignupsController],
  providers: [ShiftSignupsService],
  exports: [ShiftSignupsService],
})
export class ShiftSignupsModule {}
