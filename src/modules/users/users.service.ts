import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordUtil } from 'src/common/utils/password.util';
import { AccountRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo user mới với account role USER
   * Chỉ có thể tạo user với role USER, không thể thay đổi role khi tạo
   */
  async create(createUserDto: CreateUserDto) {
    const { password, provider, email, username, ...userData } = createUserDto;

    // Đảm bảo role luôn là USER, không thể thay đổi
    const accountRole: AccountRole = AccountRole.USER;

    return this.prisma.user.create({
      data: {
        name: userData.name,
        phone: userData.phone,
        account: {
          create: {
            passwordHash: await PasswordUtil.hash(password),
            provider: provider || 'local',
            email: email,
            username: username,
            role: accountRole, // Luôn là USER, không thể thay đổi
          },
        },
      },
      include: {
        employees: true,
        branches: true,
        departments: true,
      },
    });
  }

  async findAll(skip?: number, take?: number) {
    return this.prisma.user.findMany({
      skip,
      take,
      where: {
        account: {
          role: AccountRole.USER,
        },
      },
      include: {
        employees: true,
        branches: true,
        departments: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        account: {
          role: AccountRole.USER,
        },
      },
      include: {
        employees: true,
        branches: true,
        departments: true,
        account: {
          select: {
            id: true,
            provider: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id, account: { role: AccountRole.USER } },
        data: updateUserDto,
        include: {
          employees: true,
          branches: true,
          departments: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.user.delete({
        where: { id, account: { role: AccountRole.USER } },
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async count() {
    return this.prisma.user.count();
  }
}
