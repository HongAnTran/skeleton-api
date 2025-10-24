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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TaskScheduleService } from '../services/task-schedule.service';
import { CreateTaskScheduleDto } from '../dto/task-schedule/create-task-schedule.dto';
import { UpdateTaskScheduleDto } from '../dto/task-schedule/update-task-schedule.dto';
import { QueryTaskScheduleDto } from '../dto/task-schedule/query-task-schedule.dto';

@ApiTags('Task Schedules')
@ApiBearerAuth()
@Controller('task-schedules')
export class TaskScheduleController {
  constructor(private readonly taskScheduleService: TaskScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  create(@Request() req, @Body() createDto: CreateTaskScheduleDto) {
    return this.taskScheduleService.create(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all task schedules' })
  @ApiResponse({ status: 200, description: 'Return all schedules' })
  findAll(@Request() req, @Query() query: QueryTaskScheduleDto) {
    return this.taskScheduleService.findAll(req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task schedule by ID' })
  @ApiResponse({ status: 200, description: 'Return schedule details' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.taskScheduleService.findOne(req.user.userId, id);
  }

  @Post(':id/generate-cycles')
  @ApiOperation({ summary: 'Generate cycles for a schedule' })
  @ApiResponse({ status: 200, description: 'Cycles generated successfully' })
  @ApiQuery({
    name: 'upToDate',
    required: false,
    description: 'Generate cycles up to this date (ISO format)',
  })
  generateCycles(@Request() req, @Param('id') id: string) {
    return this.taskScheduleService.generateCycles(req.user.userId, id);
  }

  @Post('generate-all-cycles')
  @ApiOperation({ summary: 'Generate cycles for all active schedules' })
  @ApiResponse({
    status: 200,
    description: 'Cycles generated for all schedules',
  })
  @ApiQuery({
    name: 'upToDate',
    required: false,
    description: 'Generate cycles up to this date (ISO format)',
  })
  generateAllCycles(@Request() req) {
    return this.taskScheduleService.generateAllActiveCycles(req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskScheduleDto,
  ) {
    return this.taskScheduleService.update(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.taskScheduleService.remove(req.user.userId, id);
  }
}
