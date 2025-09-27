import { Module } from '@nestjs/common';
import { ShiftSlotsController } from './shift-slots.controller';
import { ShiftSlotsService } from './shift-slots.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ShiftSlotsController],
  providers: [ShiftSlotsService],
  exports: [ShiftSlotsService],
})
export class ShiftSlotsModule {}
