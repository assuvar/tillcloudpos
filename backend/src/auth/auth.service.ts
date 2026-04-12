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
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as sgMail from '@sendgrid/mail';
import { Twilio } from 'twilio';

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

@Injectable()
export class AuthService {
  private otpMemoryStore = new Map<
    string,
    {
      codeHash: string;
      expiresAt: Date;
      attempts: number;
      used: boolean;
    }
  >();

  constructor(
    public usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private isOtpTableMissing(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'P2021'
    );
  }

  private otpKey(channel: OtpChannel, destination: string) {
    return `${channel}:${destination.trim().toLowerCase()}`;
  }

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

    const normalizedDestination = destination.trim().toLowerCase();
    const otp = '526252'; // Fixed OTP for development as requested
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const codeHash = await bcrypt.hash(otp, 10);

    try {
      // Invalidate previous unused OTPs for this identifier
      await this.prisma.otp.updateMany({
        where: { identifier: normalizedDestination, used: false },
        data: { used: true },
      });

      await this.prisma.otp.create({
        data: {
          identifier: normalizedDestination,
          codeHash,
          expiresAt,
        },
      });
    } catch (error) {
      if (!this.isOtpTableMissing(error)) {
        throw error;
      }

      // Fallback for environments where OTP migration was not applied yet.
      this.otpMemoryStore.set(normalizedDestination, {
        codeHash,
        expiresAt,
        attempts: 0,
        used: false,
      });
    }

    // In Development Mode, we log the OTP to the console.
    console.log(
      `\x1b[33m%s\x1b[0m`,
      `[OTP_DEV_MODE] ${channel.toUpperCase()} to ${normalizedDestination}: ${otp}`,
    );

    // Try to send via real providers if configured
    try {
      const isEmail = channel === 'email';

      if (isEmail) {
        const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
        const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
        if (apiKey && fromEmail) {
          sgMail.setApiKey(apiKey);
          await sgMail.send({
            to: normalizedDestination,
            from: fromEmail,
            subject: 'Verification Code - TillCloudPOS',
            text: `Your verification code is: ${otp}. It expires in 5 minutes.`,
            html: `<strong>Your verification code is: ${otp}</strong><p>It expires in 5 minutes.</p>`,
          });
          console.log(`[REAL_OTP] Email sent to ${normalizedDestination}`);
        }
      } else {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        const fromNumber = this.configService.get<string>(
          'TWILIO_PHONE_NUMBER',
        );
        if (accountSid && authToken && fromNumber) {
          const client = new Twilio(accountSid, authToken);
          await client.messages.create({
            body: `Your TillCloudPOS verification code is: ${otp}`,
            from: fromNumber,
            to: normalizedDestination,
          });
          console.log(`[REAL_OTP] SMS sent to ${normalizedDestination}`);
        }
      }
    } catch (err: any) {
      console.error(
        `[OTP_SEND_ERROR] Failed to send via real provider: ${err.message}`,
      );
      // Don't throw, we've already logged it to console as fallback
    }

    return {
      success: true,
      expiresIn: 300,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
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

    const normalizedDestination = destination.trim().toLowerCase();
    try {
      const otpRecord = await this.prisma.otp.findFirst({
        where: {
          identifier: normalizedDestination,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        throw new UnauthorizedException('OTP has expired or does not exist');
      }

      if (otpRecord.attempts >= 5) {
        await this.prisma.otp.update({
          where: { id: otpRecord.id },
          data: { used: true },
        });
        throw new UnauthorizedException(
          'Too many failed attempts. Please request a new OTP.',
        );
      }

      const isMatch = await bcrypt.compare(normalizedCode, otpRecord.codeHash);
      if (!isMatch) {
        await this.prisma.otp.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });
        throw new UnauthorizedException('Invalid OTP code');
      }

      // Mark as used
      await this.prisma.otp.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
    } catch (error) {
      if (!this.isOtpTableMissing(error)) {
        throw error;
      }

      const otpRecord = this.otpMemoryStore.get(normalizedDestination);
      if (!otpRecord || otpRecord.used || otpRecord.expiresAt <= new Date()) {
        this.otpMemoryStore.delete(normalizedDestination);
        throw new UnauthorizedException('OTP has expired or does not exist');
      }

      if (otpRecord.attempts >= 5) {
        otpRecord.used = true;
        this.otpMemoryStore.set(normalizedDestination, otpRecord);
        throw new UnauthorizedException(
          'Too many failed attempts. Please request a new OTP.',
        );
      }

      const isMatch = await bcrypt.compare(normalizedCode, otpRecord.codeHash);
      if (!isMatch) {
        otpRecord.attempts += 1;
        this.otpMemoryStore.set(normalizedDestination, otpRecord);
        throw new UnauthorizedException('Invalid OTP code');
      }

      otpRecord.used = true;
      this.otpMemoryStore.set(normalizedDestination, otpRecord);
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
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role as UserRole,
      restaurantId: user.restaurantId,
      onboardingCompleted: user.onboardingCompleted,
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
    selectedRole: 'MANAGER' | 'CASHIER',
  ): Promise<AuthenticatedUser> {
    if (!/^\d{4,6}$/.test(pin)) {
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
        : user.role === 'MANAGER' || user.role === 'ADMIN';

    if (!validForSelectedRole) {
      throw new UnauthorizedException('Role does not match selected POS login type');
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

  async generateKitchenPairingToken(restaurantId: string, terminalId: string) {
    const pairingToken = randomBytes(24).toString('hex');
    const terminal = await this.prisma.terminal.findFirst({
      where: {
        id: terminalId,
        restaurantId,
      },
    });

    if (!terminal) {
      throw new BadRequestException('Terminal not found for this restaurant');
    }

    await this.prisma.terminal.update({
      where: { id: terminalId },
      data: {
        pairingCode: pairingToken,
        pairedAt: null,
      },
    });

    return {
      pairingToken,
      terminalId,
    };
  }

  async authorizeKitchen(pairingToken: string) {
    if (!pairingToken) {
      throw new UnauthorizedException('Pairing token is required');
    }

    const terminal = await this.prisma.terminal.findFirst({
      where: {
        pairingCode: pairingToken,
        isActive: true,
      },
    });

    if (!terminal) {
      throw new UnauthorizedException('Invalid kitchen pairing token');
    }

    await this.prisma.terminal.update({
      where: { id: terminal.id },
      data: {
        pairedAt: new Date(),
      },
    });

    const kitchenUser: AuthenticatedUser = {
      id: `kitchen-${terminal.id}`,
      email: `${terminal.id}@kitchen.local`,
      fullName: terminal.name,
      role: 'KITCHEN',
      restaurantId: terminal.restaurantId,
      onboardingCompleted: true,
    };

    const payload = this.buildSessionPayload(kitchenUser);

    return {
      accessToken: this.accessToken(payload),
      accessTokenExpiresIn: 3600,
      user: kitchenUser,
      terminal: {
        id: terminal.id,
        name: terminal.name,
        type: terminal.type,
      },
    };
  }

  async register(registrationData: {
    email?: string;
    password?: string;
    businessName?: string;
    fullName?: string;
  }) {
    const normalizedEmail = registrationData?.email?.trim().toLowerCase();
    const password = registrationData?.password;
    const businessName = registrationData?.businessName;

    if (!normalizedEmail || !password || !businessName) {
      throw new BadRequestException(
        'email, password and businessName are required',
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
          streetAddress: '',
          suburb: '',
          postcode: '',
        },
      });

      const passwordHash = await bcrypt.hash(password, 10);

      return tx.user.create({
        data: {
          email: normalizedEmail,
          fullName: registrationData.fullName || normalizedEmail,
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
    if (!/^\d{4,6}$/.test(pin)) {
      throw new BadRequestException('PIN must be 4 to 6 digits');
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
