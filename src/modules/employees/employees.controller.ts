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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Prisma } from '@prisma/client';
import { JwtPayload, User } from 'src/common/decorators/user.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, type: Employee })
  create(
    @User() user: JwtPayload,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(user.userId, createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all employees with pagination' })
  @ApiResponse({ status: 200, type: [Employee] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  async findAll(
    @User() user: JwtPayload,
    @Query() paginationDto: PaginationDto,
    @Query('branchId') branchId?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const userId = user.userId;
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    let employees, total;

    const where: Prisma.EmployeeWhereInput = { userId };
    if (branchId) {
      where.branchId = branchId;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }

    [employees, total] = await Promise.all([
      this.employeesService.findAll(where, skip, limit),
      this.employeesService.count(where),
    ]);

    return {
      data: employees,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: 200, type: Employee })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee by ID' })
  @ApiResponse({ status: 200, type: Employee })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete employee by ID' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
