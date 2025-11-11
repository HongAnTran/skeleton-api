import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TaskCycleService } from '../services/task-cycle.service';
import { CreateTaskCycleDto } from '../dto/task-cycle/create-task-cycle.dto';
import { UpdateTaskCycleDto } from '../dto/task-cycle/update-task-cycle.dto';
import { QueryTaskCycleDto } from '../dto/task-cycle/query-task-cycle.dto';
import { CreateTaskCycleAllDto } from 'src/modules/tasks/dto/task-cycle/create-task-cycle-all.dto';

@ApiTags('Task Cycles')
@ApiBearerAuth()
@Controller('task-cycles')
export class TaskCycleController {
  constructor(private readonly taskCycleService: TaskCycleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task cycle' })
  @ApiResponse({ status: 201, description: 'Cycle created successfully' })
  create(@Request() req, @Body() createDto: CreateTaskCycleDto) {
    return this.taskCycleService.create(req.user.userId, createDto);
  }
  @Post('all')
  @ApiOperation({ summary: 'Create many task cycles for all task' })
  @ApiResponse({ status: 201, description: 'Cycles created successfully' })
  createManyForAllTask(
    @Request() req,
    @Body() createDto: CreateTaskCycleAllDto,
  ) {
    return this.taskCycleService.createManyForAllTask(
      req.user.userId,
      createDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all task cycles' })
  @ApiResponse({ status: 200, description: 'Return all cycles' })
  findAll(@Request() req, @Query() query: QueryTaskCycleDto) {
    return this.taskCycleService.findAll(req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task cycle by ID' })
  @ApiResponse({ status: 200, description: 'Return cycle details' })
  @ApiResponse({ status: 404, description: 'Cycle not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.taskCycleService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task cycle' })
  @ApiResponse({ status: 200, description: 'Cycle updated successfully' })
  @ApiResponse({ status: 404, description: 'Cycle not found' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskCycleDto,
  ) {
    return this.taskCycleService.update(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task cycle' })
  @ApiResponse({ status: 200, description: 'Cycle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Cycle not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.taskCycleService.remove(req.user.userId, id);
  }
}
