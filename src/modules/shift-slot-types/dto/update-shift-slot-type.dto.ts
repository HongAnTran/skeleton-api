import { PartialType } from '@nestjs/swagger';
import { CreateShiftSlotTypeDto } from './create-shift-slot-type.dto';

export class UpdateShiftSlotTypeDto extends PartialType(
  CreateShiftSlotTypeDto,
) {}
