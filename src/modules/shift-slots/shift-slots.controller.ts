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
import { ShiftSlotsService } from './shift-slots.service';
import { CreateShiftSlotDto } from './dto/create-shift-slot.dto';
import { UpdateShiftSlotDto } from './dto/update-shift-slot.dto';
import { ShiftSlot } from './entities/shift-slot.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Prisma } from '@prisma/client';

@ApiTags('Shift Slots')
@ApiBearerAuth()
@Controller('shift-slots')
export class ShiftSlotsController {
  constructor(private readonly shiftSlotsService: ShiftSlotsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shift slot' })
  @ApiResponse({ status: 201, type: ShiftSlot })
  create(@Body() createShiftSlotDto: CreateShiftSlotDto) {
    return this.shiftSlotsService.create(createShiftSlotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shift slots with pagination' })
  @ApiResponse({ status: 200, type: [ShiftSlot] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('branchId') branchId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    let shiftSlots, total;

    const where: Prisma.ShiftSlotWhereInput = {};
    if (branchId) {
      where.branchId = branchId;
    }
    if (userId) {
      where.userId = userId;
    }
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    [shiftSlots, total] = await Promise.all([
      this.shiftSlotsService.findAll(where, skip, limit),
      this.shiftSlotsService.count(where),
    ]);

    return {
      data: shiftSlots,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift slot by ID' })
  @ApiResponse({ status: 200, type: ShiftSlot })
  findOne(@Param('id') id: string) {
    return this.shiftSlotsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shift slot by ID' })
  @ApiResponse({ status: 200, type: ShiftSlot })
  update(
    @Param('id') id: string,
    @Body() updateShiftSlotDto: UpdateShiftSlotDto,
  ) {
    return this.shiftSlotsService.update(id, updateShiftSlotDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shift slot by ID' })
  @ApiResponse({ status: 200, description: 'Shift slot deleted successfully' })
  remove(@Param('id') id: string) {
    return this.shiftSlotsService.remove(id);
  }
}
