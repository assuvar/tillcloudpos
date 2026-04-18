import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { PERMISSIONS } from './permissions/permissions.constants';

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
    restaurantId: string;
    role: string;
  };
};

type RefreshBody = {
  posSessionToken?: string;
};

type AssignPinBody = {
  userId?: string;
  pin?: string;
};

type SendOtpBody = {
  channel?: 'email' | 'mobile';
  destination?: string;
};

type VerifyOtpBody = {
  channel?: 'email' | 'mobile';
  destination?: string;
  code?: string;
};

type CheckEmailBody = {
  email?: string;
};

const REFRESH_COOKIE_NAME = 'refresh_token';
const TEMP_STATIC_OTP = '526252';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: '/',
    });
  }

  private clearRefreshCookie(res: Response) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });
  }

  private extractRefreshCookie(req: Request): string | undefined {
    const rawCookie = req.headers.cookie;
    if (!rawCookie) {
      return undefined;
    }

    const tokenCookie = rawCookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${REFRESH_COOKIE_NAME}=`));

    if (!tokenCookie) {
      return undefined;
    }

    return decodeURIComponent(tokenCookie.split('=').slice(1).join('='));
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: { email?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!loginDto?.email || !loginDto?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.authService.validateDashboardUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = this.authService.login(user);
    this.setRefreshCookie(res, session.refreshToken);

    return {
      access_token: session.accessToken,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
      user: session.user,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('pos-login')
  async posLogin(
    @Body()
    posLoginDto: {
      role?: 'MANAGER' | 'CASHIER';
      identifier?: string;
      pin?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!posLoginDto?.role || !posLoginDto?.identifier || !posLoginDto?.pin) {
      throw new UnauthorizedException('Invalid POS credentials');
    }

    const user = await this.authService.validatePosUser(
      posLoginDto.identifier,
      posLoginDto.pin,
      posLoginDto.role,
    );

    const session = this.authService.loginPos(user);
    this.setRefreshCookie(res, session.refreshToken);

    return {
      access_token: session.accessToken,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
      pos_session_token: session.posSessionToken,
      posSessionTokenExpiresIn: session.posSessionTokenExpiresIn,
      user: session.user,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('pin-login')
  async pinLogin(
    @Body()
    pinLoginDto: {
      role?: 'MANAGER' | 'CASHIER' | 'KITCHEN';
      identifier?: string;
      pin?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!pinLoginDto?.role || !pinLoginDto?.identifier || !pinLoginDto?.pin) {
      throw new UnauthorizedException('Invalid PIN credentials');
    }

    const user = await this.authService.validatePosUser(
      pinLoginDto.identifier,
      pinLoginDto.pin,
      pinLoginDto.role,
    );

    if (pinLoginDto.role === 'KITCHEN') {
      const session = this.authService.login(user);
      this.setRefreshCookie(res, session.refreshToken);

      return {
        access_token: session.accessToken,
        accessTokenExpiresIn: session.accessTokenExpiresIn,
        user: session.user,
      };
    }

    const session = this.authService.loginPos(user);
    this.setRefreshCookie(res, session.refreshToken);

    return {
      access_token: session.accessToken,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
      pos_session_token: session.posSessionToken,
      posSessionTokenExpiresIn: session.posSessionTokenExpiresIn,
      user: session.user,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body() body: RefreshBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.extractRefreshCookie(req);
    const refreshed = await this.authService.refreshTokens(
      refreshToken,
      body?.posSessionToken,
    );

    if (refreshed.refreshToken) {
      this.setRefreshCookie(res, refreshed.refreshToken);
    }

    return {
      access_token: refreshed.accessToken,
      accessTokenExpiresIn: 3600,
      user: refreshed.user,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('otp/send')
  async sendOtp(@Body() body: SendOtpBody) {
    if (!body?.channel || !body?.destination) {
      throw new BadRequestException('channel and destination are required');
    }

    // Optional: Check if user exists before sending OTP if desired,
    // or just send it and check during verification.
    return this.authService.sendOtp(body.channel, body.destination);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  async verifyOtp(
    @Body() body: VerifyOtpBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body?.channel || !body?.destination || !body?.code) {
      throw new BadRequestException(
        'channel, destination and code are required',
      );
    }

    const normalizedCode = String(body.code).replace(/\D/g, '').trim();
    if (normalizedCode !== TEMP_STATIC_OTP) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.authService.verifyOtp(
      body.channel,
      body.destination,
      TEMP_STATIC_OTP,
    );

    // After internal verification, find the user to log them in
    const user = await this.authService.usersService.findByEmail(
      body.destination.trim().toLowerCase(),
    );

    if (!user) {
      // For registration, the user doesn't exist yet. We return success so they can complete the flow.
      return {
        success: true,
        message: 'OTP verified (Registration Flow)',
      };
    }

    const session = this.authService.login(this.authService.mapUser(user));
    this.setRefreshCookie(res, session.refreshToken);

    return {
      access_token: session.accessToken,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
      user: session.user,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('otp/verify')
  async verifyOtpLegacy(
    @Body() body: VerifyOtpBody,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.verifyOtp(body, res);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('check-email')
  async checkEmail(@Body() body: CheckEmailBody) {
    if (!body?.email) {
      throw new BadRequestException('email is required');
    }

    return this.authService.isEmailAvailable(body.email);
  }

  @Public()
  @Post('register')
  async register(
    @Body()
    registerDto: {
      email?: string;
      password?: string;
      businessName?: string;
      fullName?: string;
      mobile?: string;
      serviceModels?: string[];
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.register(registerDto);
    this.setRefreshCookie(res, session.refreshToken);

    return {
      access_token: session.accessToken,
      accessTokenExpiresIn: session.accessTokenExpiresIn,
      user: session.user,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearRefreshCookie(res);
    return { success: true };
  }

  @Roles('ADMIN', 'MANAGER')
  @RequirePermissions(PERMISSIONS.STAFF_EDIT)
  @HttpCode(HttpStatus.OK)
  @Post('cashier/pin')
  async assignCashierPin(@Body() body: AssignPinBody) {
    if (!body?.userId || !body?.pin) {
      throw new UnauthorizedException('userId and pin are required');
    }

    return this.authService.assignPin(body.userId, body.pin);
  }
}
