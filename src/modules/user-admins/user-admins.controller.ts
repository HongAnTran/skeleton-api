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
import { UserAdminsService } from './user-admins.service';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UserAdmin } from './entities/user-admin.entity';
import { Prisma } from '@prisma/client';
import { JwtPayload, User } from 'src/common/decorators/user.decorator';
import { QueryUserAdminDto } from './dto/query-user-admin.dto';

@ApiTags('User Admins')
@ApiBearerAuth()
@Controller('user-admins')
export class UserAdminsController {
  constructor(private readonly userAdminsService: UserAdminsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user admin' })
  @ApiResponse({ status: 201, type: UserAdmin })
  create(
    @User() user: JwtPayload,
    @Body() createUserAdminDto: CreateUserAdminDto,
  ) {
    return this.userAdminsService.create(user.userId, createUserAdminDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user admins with pagination' })
  @ApiResponse({ status: 200, type: [UserAdmin] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  async findAll(@User() user: JwtPayload, @Query() queryDto: QueryUserAdminDto) {
    const userId = user.userId;
    const { page, limit, userId: queryUserId } = queryDto;
    const skip = (page - 1) * limit;

    let userAdmins, total;

    const where: Prisma.UserAdminWhereInput = { userId };
    if (queryUserId) {
      where.userId = queryUserId;
    }

    [userAdmins, total] = await Promise.all([
      this.userAdminsService.findAll(where, skip, limit),
      this.userAdminsService.count(where),
    ]);

    return {
      data: userAdmins,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user admin by ID' })
  @ApiResponse({ status: 200, type: UserAdmin })
  findOne(@Param('id') id: string) {
    return this.userAdminsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user admin by ID' })
  @ApiResponse({ status: 200, type: UserAdmin })
  update(
    @Param('id') id: string,
    @Body() updateUserAdminDto: UpdateUserAdminDto,
  ) {
    return this.userAdminsService.update(id, updateUserAdminDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user admin by ID' })
  @ApiResponse({ status: 200, description: 'User admin deleted successfully' })
  remove(@Param('id') id: string) {
    return this.userAdminsService.remove(id);
  }
}
