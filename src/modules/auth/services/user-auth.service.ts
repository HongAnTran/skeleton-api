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
import { UserRole } from '@prisma/client';

@Injectable()
export class UserAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const account = await this.prisma.account.findUnique({
      where: { email },
      include: { user: true },
    });

    if (!account || !account.passwordHash || !account.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      account.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      accountId: account.id,
      email: account.email,
      role: account.user.role,
      userId: account.user.id,
    });

    await this.updateRefreshToken(account.id, tokens.refresh_token);

    return tokens;
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Access Denied - Invalid user');
    }

    return user;
  }

  async refreshTokens(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    const account = await this.prisma.account.findFirst({
      where: { refreshToken },
      include: { user: true },
    });

    if (!account?.user) {
      throw new ForbiddenException('Access Denied - Invalid refresh token');
    }

    const tokens = await this.generateTokens({
      accountId: account.id,
      email: account.email,
      role: account.user.role,
      userId: account.user.id,
    });

    await this.updateRefreshToken(account.id, tokens.refresh_token);

    return tokens;
  }

  async logout(accountId: string): Promise<{ message: string }> {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { refreshToken: null },
    });
    return { message: 'User logged out successfully' };
  }

  private async generateTokens({
    userId,
    email,
    role,
    accountId,
  }: {
    accountId: string;
    userId: string;
    email: string;
    role: UserRole;
  }) {
    const payload = {
      sub: accountId,
      email,
      role,
      type: 'user' as const,
      userId,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'refresh-secret',
        ),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ),
      }),
    ]);

    const expiresIn = this.parseExpirationTime(
      this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    );

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
