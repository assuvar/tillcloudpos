import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ServiceModel } from '../../generated/prisma';
import * as bcrypt from 'bcrypt';
import { ALLOWED_SERVICE_MODELS } from '../restaurant/restaurant.constants';

type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN';

type UserSessionPayload = {
  sub: string;
  email: string;
  restaurantId: string;
  role: UserRole;
  onboardingCompleted: boolean;
};

type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  restaurantId: string;
  onboardingCompleted: boolean;
};

type RestaurantOnboardingSnapshot = {
  onboardingCompleted?: boolean | null;
  name?: string | null;
  streetAddress?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  phone?: string | null;
  serviceModels?: string[] | null;
};

type RefreshResult = {
  accessToken: string;
  user: AuthenticatedUser;
  refreshToken?: string;
};

type OtpChannel = 'email' | 'mobile';

type OtpSendResult = {
  success: boolean;
  expiresIn: number;
  devOtp?: string;
};

type OtpVerifyResult = {
  success: boolean;
};

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 5 * 60 * 1000;
const TEMP_STATIC_OTP = '526252';
// TODO: Replace with real OTP service (Twilio / Email) using ENV variables

@Injectable()
export class AuthService {
  constructor(
    public usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private validateOtpDestination(channel: OtpChannel, destination: string) {
    if (!destination?.trim()) {
      throw new BadRequestException('OTP destination is required');
    }

    if (channel === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(destination.trim())) {
        throw new BadRequestException('Invalid email destination');
      }
      return;
    }

    const digits = destination.replace(/\D/g, '');
    if (digits.length < 8) {
      throw new BadRequestException('Invalid mobile destination');
    }
  }

  async sendOtp(
    channel: OtpChannel,
    destination: string,
  ): Promise<OtpSendResult> {
    this.validateOtpDestination(channel, destination);

    return {
      success: true,
      expiresIn: 300,
    };
  }

  async verifyOtp(
    channel: OtpChannel,
    destination: string,
    code: string,
  ): Promise<OtpVerifyResult> {
    this.validateOtpDestination(channel, destination);

    const normalizedCode = code?.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new BadRequestException('OTP must be a 6-digit code');
    }

    if (normalizedCode !== TEMP_STATIC_OTP) {
      throw new UnauthorizedException('Invalid OTP');
    }

    return { success: true };
  }

  public mapUser(user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    role: string;
    restaurantId: string;
    onboardingCompleted: boolean;
    restaurant?: RestaurantOnboardingSnapshot | null;
  }): AuthenticatedUser {
    const normalizedServiceModels = Array.isArray(user.restaurant?.serviceModels)
      ? user.restaurant!.serviceModels
          .map((value) => String(value).trim().toUpperCase())
          .filter((value) => ALLOWED_SERVICE_MODELS.includes(value as ServiceModel))
      : [];

    const restaurantSetupComplete =
      !!user.restaurant?.name?.trim() &&
      !!user.restaurant?.streetAddress?.trim() &&
      !!user.restaurant?.phone?.trim() &&
      normalizedServiceModels.length > 0;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as UserRole,
      restaurantId: user.restaurantId,
      onboardingCompleted:
        user.onboardingCompleted ||
        Boolean(user.restaurant?.onboardingCompleted) ||
        restaurantSetupComplete,
    };
  }

  private async markLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  private buildSessionPayload(user: AuthenticatedUser): UserSessionPayload {
    return {
      email: user.email,
      sub: user.id,
      restaurantId: user.restaurantId,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
    };
  }

  private accessToken(payload: UserSessionPayload) {
    return this.jwtService.sign(
      { ...payload, type: 'access' },
      { expiresIn: '1h' },
    );
  }

  private refreshToken(payload: UserSessionPayload) {
    return this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
        expiresIn: '30d',
      },
    );
  }

  private posSessionToken(payload: UserSessionPayload) {
    return this.jwtService.sign(
      { ...payload, type: 'pos_session' },
      {
        secret:
          this.configService.get<string>('JWT_POS_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
        expiresIn: '8h',
      },
    );
  }

  private async findLoginCandidateByEmail(email: string) {
    const users = await this.prisma.user.findMany({
      where: { email },
      include: { restaurant: true },
      take: 2,
    });

    if (users.length === 0) {
      return null;
    }

    if (users.length > 1) {
      throw new UnauthorizedException(
        'Multiple accounts found for this email. Please contact support.',
      );
    }

    return users[0];
  }

  async validateDashboardUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.findLoginCandidateByEmail(normalizedEmail);

    if (
      user &&
      user.isActive &&
      user.passwordHash &&
      ['ADMIN', 'MANAGER'].includes(user.role)
    ) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (isMatch) {
        await this.markLastLogin(user.id);
        return this.mapUser(user);
      }
    }

    return null;
  }

  async validatePosUser(
    identifier: string,
    pin: string,
    selectedRole: 'MANAGER' | 'CASHIER' | 'KITCHEN',
  ): Promise<AuthenticatedUser> {
    if (!/^\d{4}$/.test(pin)) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const normalizedIdentifier = identifier.trim();
    const maybeEmail = normalizedIdentifier.toLowerCase();

    const user = normalizedIdentifier.includes('@')
      ? await this.findLoginCandidateByEmail(maybeEmail)
      : await this.prisma.user.findUnique({
          where: { id: normalizedIdentifier },
          include: { restaurant: true },
        });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const validForSelectedRole =
      selectedRole === 'CASHIER'
        ? user.role === 'CASHIER'
        : selectedRole === 'MANAGER'
          ? user.role === 'MANAGER'
          : user.role === 'KITCHEN';

    if (!validForSelectedRole) {
      throw new UnauthorizedException(
        'Role does not match selected POS login type',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    if (!user.pinHash) {
      throw new UnauthorizedException('PIN is not configured for this user');
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account temporarily locked. Please try again later.',
      );
    }

    const isMatch = await bcrypt.compare(pin, user.pinHash);
    if (!isMatch) {
      const nextAttempts = (user.pinFailedAttempts || 0) + 1;
      const shouldLock = nextAttempts >= MAX_PIN_ATTEMPTS;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + PIN_LOCKOUT_MS)
        : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          pinFailedAttempts: shouldLock ? 0 : nextAttempts,
          pinLockedUntil: lockedUntil,
        },
      });

      console.warn(
        `[POS_PIN_FAILED] user=${user.id} attempts=${nextAttempts}${
          shouldLock ? ' LOCKED' : ''
        }`,
      );

      if (shouldLock) {
        throw new UnauthorizedException(
          'Account temporarily locked. Please try again later.',
        );
      }

      throw new UnauthorizedException('Invalid PIN');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
    });

    return this.mapUser(user);
  }

  login(user: AuthenticatedUser) {
    const payload = this.buildSessionPayload(user);
    return {
      accessToken: this.accessToken(payload),
      refreshToken: this.refreshToken(payload),
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 60 * 60 * 24 * 30,
      user,
    };
  }

  loginPos(user: AuthenticatedUser) {
    const payload = this.buildSessionPayload(user);
    return {
      accessToken: this.accessToken(payload),
      refreshToken: this.refreshToken(payload),
      posSessionToken: this.posSessionToken(payload),
      accessTokenExpiresIn: 3600,
      posSessionTokenExpiresIn: 60 * 60 * 8,
      refreshTokenExpiresIn: 60 * 60 * 24 * 30,
      user,
    };
  }

  async refreshTokens(
    refreshToken?: string,
    posSessionToken?: string,
  ): Promise<RefreshResult> {
    let payload: UserSessionPayload | null = null;
    let shouldRotateRefresh = false;

    if (refreshToken) {
      const decoded = this.jwtService.verify<
        UserSessionPayload & { type?: string }
      >(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
      });

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      payload = decoded;
      shouldRotateRefresh = true;
    } else if (posSessionToken) {
      const decoded = this.jwtService.verify<
        UserSessionPayload & { type?: string }
      >(posSessionToken, {
        secret:
          this.configService.get<string>('JWT_POS_SECRET') ||
          this.configService.get<string>('JWT_SECRET'),
      });

      if (decoded.type !== 'pos_session' || decoded.role !== 'CASHIER') {
        throw new UnauthorizedException('Invalid POS session token');
      }

      payload = decoded;
    }

    if (!payload) {
      throw new UnauthorizedException('Refresh credentials missing');
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account unavailable');
    }

    const authUser = this.mapUser(user);
    const nextPayload = this.buildSessionPayload(authUser);

    return {
      accessToken: this.accessToken(nextPayload),
      user: authUser,
      refreshToken: shouldRotateRefresh
        ? this.refreshToken(nextPayload)
        : undefined,
    };
  }

  async register(registrationData: {
    email?: string;
    password?: string;
    businessName?: string;
    fullName?: string;
    mobile?: string;
    serviceModels?: string[];
  }) {
    const normalizedEmail = registrationData?.email?.trim().toLowerCase();
    const password = registrationData?.password;
    const businessName = registrationData?.businessName;

    if (!normalizedEmail || !password || !businessName) {
      throw new BadRequestException(
        'email, password and businessName are required',
      );
    }

    const requestedServiceModels = Array.from(
      new Set(
        (registrationData.serviceModels || []).map((value) =>
          value.trim().toUpperCase(),
        ),
      ),
    );

    const invalidServiceModels = requestedServiceModels.filter(
      (value) => !ALLOWED_SERVICE_MODELS.includes(value as ServiceModel),
    );

    const normalizedServiceModels: ServiceModel[] =
      requestedServiceModels.filter((value): value is ServiceModel =>
        ALLOWED_SERVICE_MODELS.includes(value as ServiceModel),
      );

    if (invalidServiceModels.length > 0) {
      throw new BadRequestException(
        `Invalid serviceModels: ${invalidServiceModels.join(', ')}. Allowed values: ${ALLOWED_SERVICE_MODELS.join(', ')}`,
      );
    }

    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: businessName,
          serviceModels:
            normalizedServiceModels.length > 0
              ? normalizedServiceModels
              : ['DINE_IN'],
          streetAddress: '',
          suburb: '',
          postcode: '',
          phone: registrationData.mobile?.trim() || null,
          onboardingCompleted: false,
        },
      });

      const passwordHash = await bcrypt.hash(password, 10);

      return tx.user.create({
        data: {
          email: normalizedEmail,
          fullName: registrationData.fullName || normalizedEmail,
          phone: registrationData.mobile?.trim() || null,
          role: 'ADMIN',
          passwordHash,
          restaurantId: restaurant.id,
        },
      });
    });

    return this.login(this.mapUser(user));
  }

  async isEmailAvailable(email: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('email is required');
    }

    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    return {
      available: !existingUser,
    };
  }

  async hashPin(pin: string): Promise<string> {
    if (!/^\d{4}$/.test(pin)) {
      throw new BadRequestException('PIN must be exactly 4 digits');
    }

    return bcrypt.hash(pin, 10);
  }

  async assignPin(userId: string, pin: string) {
    const pinHash = await this.hashPin(pin);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pinHash,
        pinFailedAttempts: 0,
        pinLockedUntil: null,
      },
    });

    return { success: true };
  }
}
