import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Request,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dto/task-instance/create-task.dto';
import { UpdateTaskInstanceDto } from '../dto/task-instance/update-task-instance.dto';
import { QueryTaskDto } from '../dto/task-instance/query-task.dto';

@ApiTags('Task Instances')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task instance' })
  @ApiResponse({ status: 201, description: 'Instance created successfully' })
  create(@Request() req, @Body() createDto: CreateTaskDto) {
    return this.taskService.create(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all task instances' })
  @ApiResponse({ status: 200, description: 'Return all instances' })
  findAll(@Request() req, @Query() query: QueryTaskDto) {
    return this.taskService.findAll(req.user.userId, query);
  }
  @Get('employee')
  @ApiOperation({ summary: 'Get all task instances by employee' })
  @ApiResponse({ status: 200, description: 'Return all instances' })
  findAllByEmployee(@Request() req) {
    return this.taskService.findAllByEmployee(
      req.user.userId,
      req.user.employeeId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task instance by ID' })
  @ApiResponse({ status: 200, description: 'Return instance details' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.taskService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task instance' })
  @ApiResponse({ status: 200, description: 'Instance updated successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskInstanceDto,
  ) {
    return this.taskService.update(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task instance' })
  @ApiResponse({ status: 200, description: 'Instance deleted successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.taskService.remove(req.user.userId, id);
  }
}
