import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordUtil } from 'src/common/utils/password.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, provider, email, username, ...userData } = createUserDto;
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
            role: 'USER',
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
      include: {
        employees: true,
        branches: true,
        departments: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
        where: { id },
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
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async count() {
    return this.prisma.user.count();
  }
}
