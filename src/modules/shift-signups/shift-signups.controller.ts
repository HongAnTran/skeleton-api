import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ShiftSignupsService } from './shift-signups.service';
import { CreateShiftSignupDto } from './dto/create-shift-signup.dto';
import { ShiftSignup } from './entities/shift-signup.entity';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Prisma } from '@prisma/client';
import { User, JwtPayload } from '../../common/decorators/user.decorator';

@ApiTags('Shift Signups')
@Controller('shift-signups')
export class ShiftSignupsController {
  constructor(private readonly shiftSignupsService: ShiftSignupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shift signup - Employee only' })
  @ApiResponse({ status: 201, type: ShiftSignup })
  create(
    @User() user: JwtPayload,
    @Body() createShiftSignupDto: CreateShiftSignupDto,
  ) {
    return this.shiftSignupsService.create(
      user.employeeId,
      createShiftSignupDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all shift signups with pagination - Employee only',
  })
  @ApiResponse({ status: 200, type: [ShiftSignup] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findMySignups(
    @User() user: JwtPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const employeeId = user.employeeId;
    let signups, total;

    const where: Prisma.ShiftSignupWhereInput = {};
    if (employeeId) {
      where.employeeId = employeeId;
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

  @Patch(':id')
  @ApiOperation({ summary: 'Cancel shift signup by ID - Employee only' })
  @ApiResponse({ status: 200, type: ShiftSignup })
  cancel(
    @User() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { cancelReason: string },
  ) {
    if (!body.cancelReason) {
      throw new BadRequestException('Lý do hủy ca làm việc là bắt buộc');
    }
    return this.shiftSignupsService.cancel(
      user.employeeId,
      id,
      body.cancelReason,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shift signup by ID - Admin only' })
  @ApiResponse({
    status: 200,
    description: 'Shift signup deleted successfully',
  })
  remove(@User() user: JwtPayload, @Param('id') id: string) {
    return this.shiftSignupsService.remove(user.userId, id);
  }
}
