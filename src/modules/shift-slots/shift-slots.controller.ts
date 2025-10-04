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
import { ShiftSlotsService } from './shift-slots.service';
import { CreateShiftSlotDto } from './dto/create-shift-slot.dto';
import { UpdateShiftSlotDto } from './dto/update-shift-slot.dto';
import { QueryShiftSlotDto } from './dto/query-shift-slot.dto';
import { ShiftSlot } from './entities/shift-slot.entity';
import { Prisma } from '@prisma/client';
import { JwtPayload, User } from 'src/common/decorators/user.decorator';
import { QueryShiftSlotEmployeeDto } from 'src/modules/shift-slots/dto/query-shift-slot-employee.dto';

@ApiTags('Shift Slots')
@ApiBearerAuth()
@Controller('shift-slots')
export class ShiftSlotsController {
  constructor(private readonly shiftSlotsService: ShiftSlotsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shift slot' })
  @ApiResponse({ status: 201, type: ShiftSlot })
  create(
    @User() user: JwtPayload,
    @Body() createShiftSlotDto: CreateShiftSlotDto,
  ) {
    return this.shiftSlotsService.create(user.userId, createShiftSlotDto);
  }

  @Post('many')
  @ApiOperation({ summary: 'Create many shift slots' })
  @ApiResponse({ status: 201, type: ShiftSlot })
  createMany(
    @User() user: JwtPayload,
    @Body() createShiftSlotDto: CreateShiftSlotDto,
  ) {
    return this.shiftSlotsService.createMany(user.userId, createShiftSlotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shift slots with pagination' })
  @ApiResponse({ status: 200, type: [ShiftSlot] })
  async findAll(
    @User() user: JwtPayload,
    @Query() queryDto: QueryShiftSlotDto,
  ) {
    const {
      page,
      limit,
      branchId,
      departmentId,
      typeId,
      startDate,
      endDate,
      skip,
    } = queryDto;
    const userId = user.userId;
    let shiftSlots, total;

    const where: Prisma.ShiftSlotWhereInput = {
      userId,
    };

    if (branchId) {
      where.branchId = branchId;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (typeId) {
      where.typeId = typeId;
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

  @Get('employee')
  @ApiOperation({ summary: 'Get all shift slots with pagination' })
  @ApiResponse({ status: 200, type: [ShiftSlot] })
  async findAllEmployee(
    @User() user: JwtPayload,
    @Query() queryDto: QueryShiftSlotEmployeeDto,
  ) {
    const { typeId, startDate, endDate, departmentId } = queryDto;
    const userId = user.userId;
    const employeeId = user.employeeId;
    return this.shiftSlotsService.findAllByEmployee(employeeId, userId, {
      typeId,
      departmentId,
      date:
        startDate && endDate
          ? {
              gte: new Date(startDate),
              lte: new Date(endDate),
            }
          : undefined,
    });
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
