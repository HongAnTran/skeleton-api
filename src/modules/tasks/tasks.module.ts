import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

// Services
import { TaskCycleService } from './services/task-cycle.service';
import { TaskService } from './services/task.service';
import { TaskAssignmentService } from './services/task-assignment.service';

// Controllers
import { TaskCycleController } from './controllers/task-cycle.controller';
import { TaskController } from './controllers/task.controller';
import { TaskAssignmentController } from './controllers/task-assignment.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [TaskCycleController, TaskController, TaskAssignmentController],
  providers: [TaskCycleService, TaskService, TaskAssignmentService],
  exports: [TaskCycleService, TaskService, TaskAssignmentService],
})
export class TasksModule {}
