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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, type: Branch })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches with pagination' })
  @ApiResponse({ status: 200, type: [Branch] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('userId') userId?: string,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    let branches, total;

    if (userId) {
      [branches, total] = await Promise.all([
        this.branchesService.findByUserId(userId, skip, limit),
        this.branchesService.count(userId),
      ]);
    } else {
      [branches, total] = await Promise.all([
        this.branchesService.findAll(skip, limit),
        this.branchesService.count(),
      ]);
    }

    return {
      data: branches,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  @ApiResponse({ status: 200, type: Branch })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get branches by user ID' })
  @ApiResponse({ status: 200, type: [Branch] })
  findByUserId(@Param('userId') userId: string) {
    return this.branchesService.findByUserId(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch by ID' })
  @ApiResponse({ status: 200, type: Branch })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete branch by ID' })
  @ApiResponse({ status: 200, description: 'Branch deleted successfully' })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
