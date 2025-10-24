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

// Legacy (if needed for backward compatibility)
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    TaskTemplateController,
    TaskScheduleController,
    TaskCycleController,
    TaskInstanceController,
    // Keep old controller if needed for backward compatibility
    // TasksController,
  ],
  providers: [
    TaskTemplateService,
    TaskScheduleService,
    TaskCycleService,
    TaskInstanceService,
    // Keep old service if needed
    // TasksService,
  ],
  exports: [
    TaskTemplateService,
    TaskScheduleService,
    TaskCycleService,
    TaskInstanceService,
  ],
})
export class TasksModule {}
