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
import { TaskTemplateService } from '../services/task-template.service';
import { CreateTaskTemplateDto } from '../dto/task-template/create-task-template.dto';
import { UpdateTaskTemplateDto } from '../dto/task-template/update-task-template.dto';
import { QueryTaskTemplateDto } from '../dto/task-template/query-task-template.dto';

@ApiTags('Task Templates')
@ApiBearerAuth()
@Controller('task-templates')
export class TaskTemplateController {
  constructor(private readonly taskTemplateService: TaskTemplateService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  create(@Request() req, @Body() createDto: CreateTaskTemplateDto) {
    return this.taskTemplateService.create(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all task templates' })
  @ApiResponse({ status: 200, description: 'Return all templates' })
  findAll(@Request() req, @Query() query: QueryTaskTemplateDto) {
    return this.taskTemplateService.findAll(req.user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task template by ID' })
  @ApiResponse({ status: 200, description: 'Return template details' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.taskTemplateService.findOne(req.user.userId, id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get template statistics' })
  @ApiResponse({ status: 200, description: 'Return template statistics' })
  getStatistics(@Request() req, @Param('id') id: string) {
    return this.taskTemplateService.getStatistics(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskTemplateDto,
  ) {
    return this.taskTemplateService.update(req.user.userId, id, updateDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle template active status' })
  @ApiResponse({
    status: 200,
    description: 'Template status toggled successfully',
  })
  toggleActive(@Request() req, @Param('id') id: string) {
    return this.taskTemplateService.toggleActive(req.user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete template with active schedules',
  })
  remove(@Request() req, @Param('id') id: string) {
    return this.taskTemplateService.remove(req.user.userId, id);
  }
}
