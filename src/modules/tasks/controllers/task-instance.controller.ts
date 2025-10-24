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
} from '@nestjs/swagger';
import { TaskInstanceService } from '../services/task-instance.service';
import { CreateTaskInstanceDto } from '../dto/task-instance/create-task-instance.dto';
import { UpdateTaskInstanceDto } from '../dto/task-instance/update-task-instance.dto';
import { CompleteTaskInstanceDto } from '../dto/task-instance/complete-task-instance.dto';
import { ApproveTaskInstanceDto } from '../dto/task-instance/approve-task-instance.dto';
import { RejectTaskInstanceDto } from '../dto/task-instance/reject-task-instance.dto';
import { UpdateProgressDto } from '../dto/task-instance/update-progress.dto';
import { QueryTaskInstanceDto } from '../dto/task-instance/query-task-instance.dto';

@ApiTags('Task Instances')
@ApiBearerAuth()
@Controller('task-instances')
export class TaskInstanceController {
  constructor(private readonly taskInstanceService: TaskInstanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task instance' })
  @ApiResponse({ status: 201, description: 'Instance created successfully' })
  create(@Request() req, @Body() createDto: CreateTaskInstanceDto) {
    return this.taskInstanceService.create(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all task instances' })
  @ApiResponse({ status: 200, description: 'Return all instances' })
  findAll(@Request() req, @Query() query: QueryTaskInstanceDto) {
    return this.taskInstanceService.findAll(req.user.userId, query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get task instance statistics' })
  @ApiResponse({ status: 200, description: 'Return statistics' })
  getStatistics(@Request() req, @Query() query: QueryTaskInstanceDto) {
    return this.taskInstanceService.getStatistics(req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task instance by ID' })
  @ApiResponse({ status: 200, description: 'Return instance details' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.taskInstanceService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task instance' })
  @ApiResponse({ status: 200, description: 'Instance updated successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskInstanceDto,
  ) {
    return this.taskInstanceService.update(req.user.userId, id, updateDto);
  }

  @Post(':id/update-progress')
  @ApiOperation({ summary: 'Update task instance progress' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  @ApiResponse({ status: 400, description: 'Invalid quantity' })
  updateProgress(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.taskInstanceService.updateProgress(
      req.user.employeeId,
      id,
      updateProgressDto,
    );
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a task instance' })
  @ApiResponse({ status: 200, description: 'Task completed successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot complete task or target not met',
  })
  complete(
    @Request() req,
    @Param('id') id: string,
    @Body() completeDto: CompleteTaskInstanceDto,
  ) {
    return this.taskInstanceService.complete(req.user.employeeId, id, completeDto);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a completed task instance' })
  @ApiResponse({ status: 200, description: 'Task approved successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  @ApiResponse({
    status: 400,
    description: 'Only COMPLETED tasks can be approved',
  })
  approve(
    @Request() req,
    @Param('id') id: string,
    @Body() approveDto: ApproveTaskInstanceDto,
  ) {
    return this.taskInstanceService.approve(req.user.userId, id, approveDto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a completed task instance' })
  @ApiResponse({ status: 200, description: 'Task rejected successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  @ApiResponse({
    status: 400,
    description: 'Only COMPLETED tasks can be rejected',
  })
  reject(
    @Request() req,
    @Param('id') id: string,
    @Body() rejectDto: RejectTaskInstanceDto,
  ) {
    return this.taskInstanceService.reject(req.user.userId, id, rejectDto);
  }

  @Post('cycles/:cycleId/mark-expired')
  @ApiOperation({ summary: 'Mark expired tasks in a cycle' })
  @ApiResponse({
    status: 200,
    description: 'Expired tasks marked successfully',
  })
  markExpired(@Request() req, @Param('cycleId') cycleId: string) {
    return this.taskInstanceService.markExpired(req.user.userId, cycleId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task instance' })
  @ApiResponse({ status: 200, description: 'Instance deleted successfully' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  remove(@Request() req, @Param('id') id: string) {
    return this.taskInstanceService.remove(req.user.userId, id);
  }
}
