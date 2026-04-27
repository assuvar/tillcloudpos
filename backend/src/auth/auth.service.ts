import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ServiceModel } from '../../generated/prisma';
import * as bcrypt from 'bcrypt';
import { ALLOWED_SERVICE_MODELS } from '../restaurant/restaurant.constants';
import { flattenPermissionMap } from './permissions/permissions.constants';
import { MailService } from '../mail/mail.service';

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
  permissions: string[];
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
// OTP Expiry in minutes
const OTP_EXPIRY_MINS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    public usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private permissionsService: PermissionsService,
    private mailService: MailService,
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

    const email = destination.trim().toLowerCase();

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINS * 60 * 1000);

    // Save to database
    try {
      this.logger.log(`[OTP] Saving new OTP to database for ${email}`);
      await this.prisma.otp.create({
        data: {
          identifier: email,
          codeHash,
          expiresAt,
        },
      });
      this.logger.log(`[OTP] Database save successful for ${email}`);
    } catch (dbError) {
      this.logger.error(`[OTP] DATABASE SAVE FAILED for ${email}: ${dbError.message}`, dbError.stack);
      throw new BadRequestException('Failed to generate security code. Please try again later.');
    }

    // Send email
    try {
      this.logger.log(`[OTP] DEBUG: Your code for ${email} is: ${otp}`); // Log for dev bypass
      this.logger.log(`[OTP] Attempting to send email via SMTP to ${email}`);
      await this.mailService.sendOtpEmail(email, otp);
      this.logger.log(`[OTP] Email sent successfully to ${email}`);
    } catch (mailError) {
      this.logger.error(`[OTP] EMAIL SEND FAILED to ${email}: ${mailError.message}`, mailError.stack);
      // We still return success: true if we want the user to be able to use the devOtp from logs
      // or we can throw if we want strict mode. Given the current issue, let's throw but with details.
      throw new BadRequestException(`Email service error: ${mailError.message}`);
    }

    return {
      success: true,
      expiresIn: OTP_EXPIRY_MINS * 60,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async verifyOtp(
    channel: OtpChannel,
    destination: string,
    code: string,
  ): Promise<OtpVerifyResult> {
    this.validateOtpDestination(channel, destination);

    const email = destination.trim().toLowerCase();
    const normalizedCode = code?.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new BadRequestException('OTP must be a 6-digit code');
    }

    // Find the latest unexpired and unused OTP for this email
    const storedOtp = await this.prisma.otp.findFirst({
      where: {
        identifier: email,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!storedOtp) {
      throw new UnauthorizedException(
        'OTP has expired or does not exist. Please request a new one.',
      );
    }

    // Check code hash
    const isMatch = await bcrypt.compare(normalizedCode, storedOtp.codeHash);
    if (!isMatch) {
      // Increment attempts
      await this.prisma.otp.update({
        where: { id: storedOtp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    // Mark as used
    await this.prisma.otp.update({
      where: { id: storedOtp.id },
      data: { used: true },
    });

    // Update user if they exist
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
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
    const normalizedServiceModels = Array.isArray(
      user.restaurant?.serviceModels,
    )
      ? user.restaurant.serviceModels
          .map((value) => String(value).trim().toUpperCase())
          .filter((value) =>
            ALLOWED_SERVICE_MODELS.includes(value as ServiceModel),
          )
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
      permissions: [], // Will be populated by the caller if async context allows
    };
  }

  async resolveUserWithPermissions(user: any): Promise<AuthenticatedUser> {
    const mapped = this.mapUser(user);
    const { permissions } = await this.permissionsService.getStaffPermissions(
      user.restaurantId,
      user.id,
    );

    const codes = flattenPermissionMap(permissions);
    console.log(
      `[Auth] Resolved ${codes.length} permissions for user ${user.email} (${user.role})`,
    );

    return {
      ...mapped,
      permissions: codes,
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

  private async validatePinForUser(
    user: {
      id: string;
      isActive: boolean;
      pinHash: string | null;
      pinFailedAttempts: number;
      pinLockedUntil: Date | null;
    },
    pin: string,
  ): Promise<void> {
    if (!/^[0-9]{4}$/.test(pin)) {
      throw new UnauthorizedException('Invalid PIN');
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
  }

  async validateStaffByEmailPin(
    email: string,
    pin: string,
  ): Promise<AuthenticatedUser> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.findLoginCandidateByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!['MANAGER', 'CASHIER', 'KITCHEN'].includes(user.role)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.validatePinForUser(user, pin);
    return this.mapUser(user);
  }

  async validatePosUser(
    identifier: string,
    pin: string,
    selectedRole: 'MANAGER' | 'CASHIER' | 'KITCHEN',
  ): Promise<AuthenticatedUser> {
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

    await this.validatePinForUser(user, pin);

    return this.mapUser(user);
  }

  createOtpVerificationToken(email: string): string {
    return this.jwtService.sign(
      {
        type: 'otp_verified',
        email: email.trim().toLowerCase(),
      },
      { expiresIn: '15m' },
    );
  }

  async login(user: AuthenticatedUser) {
    const payload = this.buildSessionPayload(user);
    const resolved = await this.resolveUserWithPermissions({
      ...user,
      id: user.id,
      restaurantId: user.restaurantId,
    });

    console.log(
      `[Auth] User ${user.email} logged in with ${resolved.permissions.length} permissions`,
    );

    return {
      accessToken: this.accessToken(payload),
      refreshToken: this.refreshToken(payload),
      accessTokenExpiresIn: 3600,
      refreshTokenExpiresIn: 60 * 60 * 24 * 30,
      user: resolved,
    };
  }

  async loginPos(user: AuthenticatedUser) {
    const payload = this.buildSessionPayload(user);
    const resolved = await this.resolveUserWithPermissions({
      ...user,
      id: user.id,
      restaurantId: user.restaurantId,
    });

    return {
      accessToken: this.accessToken(payload),
      refreshToken: this.refreshToken(payload),
      posSessionToken: this.posSessionToken(payload),
      accessTokenExpiresIn: 3600,
      posSessionTokenExpiresIn: 60 * 60 * 8,
      refreshTokenExpiresIn: 60 * 60 * 24 * 30,
      user: resolved,
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

    const authUser = await this.resolveUserWithPermissions(user);
    const nextPayload = this.buildSessionPayload(authUser);

    console.log(
      `[Auth] Tokens refreshed for ${authUser.email}. Permissions:`,
      authUser.permissions.length,
    );

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

    // Check if OTP was already verified for this email before the user was created
    const verifiedOtp = await this.prisma.otp.findFirst({
      where: {
        identifier: normalizedEmail,
        used: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const emailVerified = !!verifiedOtp;

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
          emailVerified,
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
