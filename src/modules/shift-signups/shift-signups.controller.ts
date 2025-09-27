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
import { ShiftSignupsService } from './shift-signups.service';
import { CreateShiftSignupDto } from './dto/create-shift-signup.dto';
import { UpdateShiftSignupDto } from './dto/update-shift-signup.dto';
import { ShiftSignup } from './entities/shift-signup.entity';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Prisma, ShiftSignupStatus } from '@prisma/client';
import { UpdateStatusDto } from 'src/modules/shift-signups/dto/update-status.dto';

@ApiTags('Shift Signups')
@ApiBearerAuth()
@Controller('shift-signups')
export class ShiftSignupsController {
  constructor(private readonly shiftSignupsService: ShiftSignupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shift signup' })
  @ApiResponse({ status: 201, type: ShiftSignup })
  create(@Body() createShiftSignupDto: CreateShiftSignupDto) {
    return this.shiftSignupsService.create(createShiftSignupDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shift signups with pagination' })
  @ApiResponse({ status: 200, type: [ShiftSignup] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  @ApiQuery({ name: 'slotId', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ShiftSignupStatus,
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('employeeId') employeeId?: string,
    @Query('slotId') slotId?: string,
    @Query('status') status?: ShiftSignupStatus,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    let signups, total;

    const where: Prisma.ShiftSignupWhereInput = {};
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (slotId) {
      where.slotId = slotId;
    }
    if (status) {
      where.status = status;
    }

    [signups, total] = await Promise.all([
      this.shiftSignupsService.findAll(where, skip, limit),
      this.shiftSignupsService.count(where),
    ]);

    return {
      data: signups,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift signup by ID' })
  @ApiResponse({ status: 200, type: ShiftSignup })
  findOne(@Param('id') id: string) {
    return this.shiftSignupsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shift signup by ID' })
  @ApiResponse({ status: 200, type: ShiftSignup })
  update(
    @Param('id') id: string,
    @Body() updateShiftSignupDto: UpdateShiftSignupDto,
  ) {
    return this.shiftSignupsService.update(id, updateShiftSignupDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update shift signup status' })
  @ApiResponse({ status: 200, type: ShiftSignup })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.shiftSignupsService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shift signup by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shift signup deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.shiftSignupsService.remove(id);
  }
}
