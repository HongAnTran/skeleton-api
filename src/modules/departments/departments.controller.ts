import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { JwtPayload } from 'src/common/decorators/user.decorator';
import { User } from 'src/common/decorators/user.decorator';
@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, type: Department })
  create(
    @User() user: JwtPayload,
    @Body() createDepartmentDto: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(user.userId, createDepartmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments with pagination' })
  @ApiResponse({ status: 200, type: [Department] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @User() user: JwtPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const userId = user.userId;

    let departments, total;

    [departments, total] = await Promise.all([
      this.departmentsService.findByUserId(userId, skip, limit),
      this.departmentsService.count(userId),
    ]);

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
