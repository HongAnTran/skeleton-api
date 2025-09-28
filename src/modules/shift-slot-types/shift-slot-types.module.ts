import { Module } from '@nestjs/common';
import { ShiftSlotTypesService } from './shift-slot-types.service';
import { DatabaseModule } from '../../database/database.module';
import { ShiftSlotTypesController } from 'src/modules/shift-slot-types/shift-slot-types.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ShiftSlotTypesController],
  providers: [ShiftSlotTypesService],
  exports: [ShiftSlotTypesService],
})
export class ShiftSlotTypesModule {}
