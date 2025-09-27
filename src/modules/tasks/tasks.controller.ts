import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { Task } from './entities/task.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { TaskStatus } from '@prisma/client';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, type: Task })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with pagination' })
  @ApiResponse({ status: 200, type: [Task] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TaskStatus,
  })
  @ApiQuery({ name: 'level', required: false, type: Number })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: TaskStatus,
    @Query('level') level?: string,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const levelNumber = level ? parseInt(level, 10) : undefined;

    let tasks, total;

    if (employeeId) {
      [tasks, total] = await Promise.all([
        this.tasksService.findByEmployeeId(employeeId, skip, limit),
        this.tasksService.count(employeeId),
      ]);
    } else if (status) {
      [tasks, total] = await Promise.all([
        this.tasksService.findByStatus(status, skip, limit),
        this.tasksService.count(undefined, status),
      ]);
    } else if (levelNumber) {
      [tasks, total] = await Promise.all([
        this.tasksService.findByLevel(levelNumber, skip, limit),
        this.tasksService.count(undefined, undefined, levelNumber),
      ]);
    } else {
      [tasks, total] = await Promise.all([
        this.tasksService.findAll(skip, limit),
        this.tasksService.count(),
      ]);
    }

    return {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  getTaskStatistics(@Query('employeeId') employeeId?: string) {
    return this.tasksService.getTaskStatistics(employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, type: Task })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get tasks by employee ID' })
  @ApiResponse({ status: 200, type: [Task] })
  findByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.tasksService.findByEmployeeId(employeeId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ status: 200, type: Task })
  updateStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(id, updateTaskStatusDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task by ID' })
  @ApiResponse({ status: 200, type: Task })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task by ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
