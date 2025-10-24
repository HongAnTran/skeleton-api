import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

// Services
import { TaskTemplateService } from './services/task-template.service';
import { TaskScheduleService } from './services/task-schedule.service';
import { TaskCycleService } from './services/task-cycle.service';
import { TaskInstanceService } from './services/task-instance.service';

// Controllers
import { TaskTemplateController } from './controllers/task-template.controller';
import { TaskScheduleController } from './controllers/task-schedule.controller';
import { TaskCycleController } from './controllers/task-cycle.controller';
import { TaskInstanceController } from './controllers/task-instance.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    TaskTemplateController,
    TaskScheduleController,
    TaskCycleController,
    TaskInstanceController,
  ],
  providers: [
    TaskTemplateService,
    TaskScheduleService,
    TaskCycleService,
    TaskInstanceService,
  ],
  exports: [
    TaskTemplateService,
    TaskScheduleService,
    TaskCycleService,
    TaskInstanceService,
  ],
})
export class TasksModule {}
