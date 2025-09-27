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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, type: Department })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments with pagination' })
  @ApiResponse({ status: 200, type: [Department] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('userId') userId?: string,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    let departments, total;

    if (userId) {
      [departments, total] = await Promise.all([
        this.departmentsService.findByUserId(userId, skip, limit),
        this.departmentsService.count(userId),
      ]);
    } else {
      [departments, total] = await Promise.all([
        this.departmentsService.findAll(skip, limit),
        this.departmentsService.count(),
      ]);
    }

    return {
      data: departments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, type: Department })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get departments by user ID' })
  @ApiResponse({ status: 200, type: [Department] })
  findByUserId(@Param('userId') userId: string) {
    return this.departmentsService.findByUserId(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update department by ID' })
  @ApiResponse({ status: 200, type: Department })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete department by ID' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully' })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
