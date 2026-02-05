import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { PasswordUtil } from 'src/common/utils/password.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserAdminsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createUserAdminDto: CreateUserAdminDto) {
    const { password, provider, email, username, ...userAdminData } =
      createUserAdminDto;

    const [account, usernameAccount] = await Promise.all([
      this.prisma.account.findUnique({
        where: {
          email: email,
        },
      }),
      this.prisma.account.findUnique({
        where: {
          username: username,
        },
      }),
    ]);

    if (account) {
      throw new BadRequestException('Email đã tồn tại');
    }
    if (usernameAccount) {
      throw new BadRequestException('Username đã tồn tại');
    }

    return this.prisma.userAdmin.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        ...userAdminData,
        account: {
          create: {
            username: username,
            email: email,
            passwordHash: await PasswordUtil.hash(password),
            provider: provider || 'local',
            role: 'ADMIN',
          },
        },
      },
    });
  }

  async findAll(
    where: Prisma.UserAdminWhereInput,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.userAdmin.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const userAdmin = await this.prisma.userAdmin.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!userAdmin) {
      throw new NotFoundException(`UserAdmin with ID ${id} not found`);
    }

    return userAdmin;
  }

  async findByUserId(userId: string) {
    return this.prisma.userAdmin.findMany({
      where: { userId },
      include: {
        account: true,
        user: true,
      },
    });
  }

  async update(id: string, updateUserAdminDto: UpdateUserAdminDto) {
    try {
      const { password, provider, email, ...userAdminData } = updateUserAdminDto;
      return await this.prisma.userAdmin.update({
        where: { id },
        data: {
          ...userAdminData,
          account: {
            update: {
              email: email || undefined,
              passwordHash: password
                ? await PasswordUtil.hash(password)
                : undefined,
              provider: provider || undefined,
            },
          },
        },
      });
    } catch (error) {
      console.log(error);
      throw new NotFoundException(`UserAdmin with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.userAdmin.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`UserAdmin with ID ${id} not found`);
    }
  }

  async count(where: Prisma.UserAdminWhereInput) {
    return this.prisma.userAdmin.count({
      where,
    });
  }
}
