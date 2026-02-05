import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../database/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class UserAdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { emailOrUsername, password } = loginDto;

    // Tìm account bằng email hoặc username
    const account = await this.prisma.account.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
      include: {
        admin: true,
      },
    });

    if (
      !account ||
      !account.passwordHash ||
      !account.admin ||
      account.role !== 'ADMIN'
    ) {
      throw new ForbiddenException('Sai tài khoản hoặc mật khẩu');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      account.passwordHash,
    );
    if (!isPasswordValid) {
      throw new ForbiddenException('Sai mật khẩu');
    }
    const owner = await this.prisma.user.findUnique({
      where: { id: account.admin.userId },
    });

    const tokens = await this.generateTokens({
      accountId: account.id,
      email: account.email,
      adminId: account.admin.id,
      role: account.role,
      userId: owner.id,
    });

    await this.updateRefreshToken(account.id, tokens.refresh_token);

    return tokens;
  }

  async getCurrentAdmin(adminId: string) {
    const admin = await this.prisma.userAdmin.findUnique({
      where: { id: adminId },
      include: {
        account: {
          select: {
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

    if (!admin) {
      throw new ForbiddenException('Access Denied - Invalid admin');
    }

    return admin;
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    const account = await this.prisma.account.findFirst({
      where: { refreshToken },
      include: { admin: true },
    });

    if (!account?.admin || account.role !== 'ADMIN') {
      throw new ForbiddenException('Access Denied - Invalid refresh token');
    }
    const owner = await this.prisma.user.findUnique({
      where: { id: account.admin.userId },
    });

    const tokens = await this.generateTokens({
      accountId: account.id,
      email: account.email,
      adminId: account.admin.id,
      role: account.role,
      userId: owner.id,
    });

    await this.updateRefreshToken(account.id, tokens.refresh_token);

    return tokens;
  }

  async logout(accountId: string): Promise<{ message: string }> {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { refreshToken: null },
    });
    return { message: 'Admin logged out successfully' };
  }

  async changePassword(
    adminId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword } = changePasswordDto;

    const admin = await this.prisma.userAdmin.findUnique({
      where: { id: adminId },
      include: { account: true },
    });

    if (!admin || !admin.account || !admin.account.passwordHash) {
      throw new ForbiddenException('Tài khoản không hợp lệ');
    }

    const account = await this.prisma.account.findUnique({
      where: { id: admin.account.id },
    });

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      account.passwordHash,
    );
    if (!isOldPasswordValid) {
      throw new ForbiddenException('Mật khẩu cũ không đúng');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.account.update({
      where: { id: account.id },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  private async generateTokens({
    adminId,
    email,
    accountId,
    role,
    userId,
  }: {
    accountId: string;
    adminId: string;
    email: string;
    role: string;
    userId: string;
  }) {
    const payload = {
      sub: accountId,
      email,
      adminId,
      role,
      userId,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'refresh-secret',
        ),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '30d',
        ),
      }),
    ]);

    const expiresIn = this.parseExpirationTime('7d');

    return {
      access_token,
      refresh_token,
      expires_in: expiresIn,
    };
  }

  private async updateRefreshToken(accountId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }

  private parseExpirationTime(exp: string): number {
    const time = parseInt(exp.slice(0, -1));
    const unit = exp.slice(-1);

    switch (unit) {
      case 's':
        return time;
      case 'm':
        return time * 60;
      case 'h':
        return time * 60 * 60;
      case 'd':
        return time * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}
