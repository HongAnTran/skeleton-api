import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UserAdminAuthService } from '../services/user-admin-auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UserAdminData } from '../dto/current-user-response.dto';

@ApiTags('User Admin Authentication')
@Controller('auth/user-admin')
export class UserAdminAuthController {
  constructor(private readonly userAdminAuthService: UserAdminAuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User admin login' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.userAdminAuthService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh user admin access token using refresh token',
  })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.userAdminAuthService.refreshTokens(refreshTokenDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User admin logout' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req: any) {
    return this.userAdminAuthService.logout(req.user.accountId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user admin information' })
  @ApiResponse({ status: 200, type: UserAdminData })
  async getCurrentAdmin(@Request() req: any) {
    const admin = await this.userAdminAuthService.getCurrentAdmin(
      req.user.adminId,
    );
    return admin;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user admin password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đổi mật khẩu thành công' },
      },
    },
  })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userAdminAuthService.changePassword(
      req.user.adminId,
      changePasswordDto,
    );
  }
}
