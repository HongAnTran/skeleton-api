import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTaskScheduleDto } from './create-task-schedule.dto';

export class UpdateTaskScheduleDto extends PartialType(
  OmitType(CreateTaskScheduleDto, ['templateId'] as const),
) {}
