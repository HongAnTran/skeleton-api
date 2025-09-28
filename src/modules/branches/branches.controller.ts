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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { User } from 'src/common/decorators/user.decorator';
import { JwtPayload } from 'src/common/decorators/user.decorator';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({ status: 201, type: Branch })
  create(@User() user: JwtPayload, @Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(user.userId, createBranchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches with pagination' })
  @ApiResponse({ status: 200, type: [Branch] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @User() user: JwtPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    let branches, total;

    [branches, total] = await Promise.all([
      this.branchesService.findByUserId(user.userId, skip, limit),
      this.branchesService.count(user.userId),
    ]);

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
