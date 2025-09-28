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
import { ShiftSlotTypesService } from './shift-slot-types.service';
import { CreateShiftSlotTypeDto } from './dto/create-shift-slot-type.dto';
import { UpdateShiftSlotTypeDto } from './dto/update-shift-slot-type.dto';
import { ShiftSlotType } from './entities/shift-slot-type.entity';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { JwtPayload } from 'src/common/decorators/user.decorator';
import { User } from 'src/common/decorators/user.decorator';

@ApiTags('Shift Slot Types')
@ApiBearerAuth()
@Controller('shift-slot-types')
export class ShiftSlotTypesController {
  constructor(private readonly shiftSlotTypesService: ShiftSlotTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shift slot type' })
  @ApiResponse({ status: 201, type: ShiftSlotType })
  create(
    @User() user: JwtPayload,
    @Body() createShiftSlotTypeDto: CreateShiftSlotTypeDto,
  ) {
    return this.shiftSlotTypesService.create(
      user.userId,
      createShiftSlotTypeDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all shift slot types with pagination' })
  @ApiResponse({ status: 200, type: [ShiftSlotType] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @User() user: JwtPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const userId = user.userId;

    let shiftSlotTypes, total;

    [shiftSlotTypes, total] = await Promise.all([
      this.shiftSlotTypesService.findByUserId(userId, skip, limit),
      this.shiftSlotTypesService.count(userId),
    ]);

    return {
      data: shiftSlotTypes,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift slot type by ID' })
  @ApiResponse({ status: 200, type: ShiftSlotType })
  findOne(@Param('id') id: string) {
    return this.shiftSlotTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shift slot type by ID' })
  @ApiResponse({ status: 200, type: ShiftSlotType })
  update(
    @Param('id') id: string,
    @Body() updateShiftSlotTypeDto: UpdateShiftSlotTypeDto,
  ) {
    return this.shiftSlotTypesService.update(id, updateShiftSlotTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shift slot type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shift slot type deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.shiftSlotTypesService.remove(id);
  }
}
