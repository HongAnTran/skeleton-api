import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
import { TaskAssignmentService } from '../services/task-assignment.service';
import {
  CreateTaskAssignmentDto,
  AssignEmployeesToCycleDto,
  RejectAssignmentDto,
  QueryAssignmentDto,
} from '../dto';
import { CompleteAssignmentDto } from '../dto/task-assignment/complete-assignment.dto';
import { TaskStatusV2 } from '@prisma/client';

@ApiTags('Task Assignments')
@ApiBearerAuth()
@Controller('task-assignments')
export class TaskAssignmentController {
  constructor(private readonly taskAssignmentService: TaskAssignmentService) {}

  // ==================== CRUD OPERATIONS ====================

  @Post()
  @ApiOperation({ summary: 'Tạo assignment mới (gán 1 nhân viên vào 1 cycle)' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  async create(@Request() req, @Body() createDto: CreateTaskAssignmentDto) {
    return this.taskAssignmentService.create(req.user.userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách assignments theo filter' })
  @ApiResponse({ status: 200, description: 'Return all assignments' })
  async findAll(@Request() req, @Query() query: QueryAssignmentDto) {
    return this.taskAssignmentService.findAll(req.user.userId, query);
  }

  @Get('pending-approvals')
  @ApiOperation({
    summary: 'Lấy danh sách assignments chờ duyệt (cho Manager)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return assignments pending approval',
  })
  async getPendingApprovals(
    @Request() req,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.taskAssignmentService.getPendingApprovals(
      req.user.userId,
      departmentId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa 1 assignment' })
  @ApiResponse({ status: 200, description: 'Assignment deleted successfully' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.taskAssignmentService.remove(req.user.userId, id);
  }

  // ==================== BULK ASSIGNMENT OPERATIONS ====================

  @Post('assign-to-cycle')
  @ApiOperation({
    summary:
      'Gán nhiều nhân viên vào 1 cycle (theo danh sách hoặc theo phòng ban)',
  })
  @ApiResponse({
    status: 201,
    description: 'Employees assigned successfully',
  })
  async assignEmployeesToCycle(
    @Request() req,
    @Body() assignDto: AssignEmployeesToCycleDto,
  ) {
    return this.taskAssignmentService.assignEmployeesToCycle(
      req.user.userId,
      assignDto,
    );
  }

  @Post('assign-department/:cycleId/:departmentId')
  @ApiOperation({
    summary: 'Gán nhanh tất cả nhân viên trong phòng ban vào 1 cycle',
  })
  @ApiResponse({
    status: 201,
    description: 'Department employees assigned successfully',
  })
  async assignDepartmentToCycle(
    @Request() req,
    @Param('cycleId') cycleId: string,
    @Param('departmentId') departmentId: string,
  ) {
    return this.taskAssignmentService.assignDepartmentToCycle(
      req.user.userId,
      cycleId,
      departmentId,
    );
  }
  // ==================== STATUS OPERATIONS ====================

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Nhân viên đánh dấu hoàn thành assignment',
  })
  @ApiResponse({ status: 200, description: 'Assignment completed' })
  async complete(
    @Request() req,
    @Param('id') id: string,
    @Body() completeDto: CompleteAssignmentDto,
  ) {
    // employeeId lấy từ JWT token
    // Giả sử trong JWT có employeeId, nếu không thì cần query từ userId
    const employeeId = req.user.employeeId || req.user.userId;

    return this.taskAssignmentService.complete(
      req.user.userId,
      id,
      employeeId,
      completeDto,
    );
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: 'Manager phê duyệt assignment',
  })
  @ApiResponse({ status: 200, description: 'Assignment approved' })
  async approve(@Request() req, @Param('id') id: string) {
    return this.taskAssignmentService.approve(req.user.userId, id);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Manager từ chối assignment',
  })
  @ApiResponse({ status: 200, description: 'Assignment rejected' })
  async reject(
    @Request() req,
    @Param('id') id: string,
    @Body() rejectDto: RejectAssignmentDto,
  ) {
    return this.taskAssignmentService.reject(req.user.userId, id, rejectDto);
  }

  // ==================== REPORTING & STATISTICS ====================

  @Get('employee/me')
  @ApiOperation({
    summary: 'Lấy danh sách assignments của 1 nhân viên',
  })
  @ApiResponse({ status: 200, description: 'Return employee assignments' })
  async getEmployeeAssignments(
    @Request() req,
    @Query('status') status?: TaskStatusV2,
  ) {
    return this.taskAssignmentService.getEmployeeAssignments(
      req.user.userId,
      req.user.employeeId,
      status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 assignment' })
  @ApiResponse({ status: 200, description: 'Return assignment details' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.taskAssignmentService.findOne(req.user.userId, id);
  }
}
