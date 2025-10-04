import { Module } from '@nestjs/common';
import { ShiftSwapsController } from './shift-swaps.controller';
import { ShiftSwapsService } from './shift-swaps.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ShiftSwapsController],
  providers: [ShiftSwapsService],
  exports: [ShiftSwapsService],
})
export class ShiftSwapsModule {}
