import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from 'crypto';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import type { UserRole } from '../auth/permissions/permissions.constants';
import {
  CreateStaffDto,
  StaffRole,
  UpdateStaffDto,
} from './dto/staff-common.dto';

type StaffActor = {
  userId: string;
  role: UserRole;
  restaurantId: string;
};

const POS_PIN_ROLES = new Set<string>([
  StaffRole.MANAGER,
  StaffRole.CASHIER,
  StaffRole.KITCHEN,
]);

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private roleRequiresPosPin(role: string) {
    return POS_PIN_ROLES.has(role);
  }

  private generatePin() {
    const pinLength = 4;
    const maxValue = 10 ** pinLength;
    return Math.floor(Math.random() * maxValue)
      .toString()
      .padStart(pinLength, '0');
  }

  private async generateUniquePin(
    restaurantId: string,
    excludeUserId?: string,
  ) {
    const existingUsers = await this.prisma.user.findMany({
      where: {
        restaurantId,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        pinHash: { not: null },
      },
      select: {
        pinHash: true,
      },
    });

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const candidate = this.generatePin();
      let isDuplicate = false;

      for (const user of existingUsers) {
        if (!user.pinHash) {
          continue;
        }
        const isMatch = await bcrypt.compare(candidate, user.pinHash);
        if (isMatch) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        return candidate;
      }
    }

    throw new InternalServerErrorException(
      'Could not generate a unique PIN, please try again',
    );
  }

  private getPinEncryptionKey() {
    const secret =
      this.configService.get<string>('STAFF_PIN_ENCRYPTION_KEY') ||
      this.configService.get<string>('PIN_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET');

    if (!secret?.trim()) {
      throw new InternalServerErrorException(
        'PIN encryption key is not configured',
      );
    }

    return createHash('sha256').update(secret.trim(), 'utf8').digest();
  }

  private encryptPin(pin: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      'aes-256-gcm',
      this.getPinEncryptionKey(),
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(pin, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decryptPin(payload: string) {
    const parts = payload.split('.');
    if (parts.length !== 3) {
      throw new InternalServerErrorException('Stored PIN format is invalid');
    }

    const [ivEncoded, tagEncoded, encryptedEncoded] = parts;
    const iv = Buffer.from(ivEncoded, 'base64');
    const authTag = Buffer.from(tagEncoded, 'base64');
    const encrypted = Buffer.from(encryptedEncoded, 'base64');

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getPinEncryptionKey(),
      iv,
    );
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  private async verifyAdminActor(
    restaurantId: string,
    actor: StaffActor,
    adminPassword: string,
  ) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can manage staff PINs');
    }

    const actorUser = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: {
        id: true,
        restaurantId: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (
      !actorUser ||
      actorUser.restaurantId !== restaurantId ||
      !actorUser.isActive
    ) {
      throw new ForbiddenException('Unauthorized PIN request');
    }

    if (!actorUser.passwordHash) {
      throw new BadRequestException(
        'Set an admin password before managing staff PINs',
      );
    }

    if (!adminPassword?.trim()) {
      throw new BadRequestException('Admin password is required');
    }

    const isPasswordValid = await bcrypt.compare(
      adminPassword.trim(),
      actorUser.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid admin password');
    }
  }

  private async logPinAction(
    restaurantId: string,
    actorUserId: string,
    staffUserId: string,
    action: 'VIEW' | 'RESET',
    status: 'SUCCESS' | 'FAILED',
    reason?: string,
  ) {
    try {
      await this.prisma.pinAuditLog.create({
        data: {
          restaurantId,
          actorUserId,
          staffUserId,
          action,
          status,
          reason,
        },
      });
    } catch {
      // Audit logging should not block PIN management operations.
    }
  }

  private sanitizeStaff(user: {
    id: string;
    restaurantId: string;
    fullName: string;
    name: string | null;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      name: user.name || user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      restaurantId: user.restaurantId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async findTenantUserOrThrow(id: string, restaurantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        restaurantId: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Staff member not found');
    }

    if (user.restaurantId !== restaurantId) {
      throw new ForbiddenException('Cross-tenant staff access is forbidden');
    }

    return user;
  }

  private ensureAdminImmutable(targetRole: string) {
    if (targetRole === (StaffRole.ADMIN as string)) {
      throw new ForbiddenException('Admin account cannot be modified here');
    }
  }

  private async assertEmailNotTaken(
    restaurantId: string,
    email: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: {
        restaurantId,
        email: this.normalizeEmail(email),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'A staff member with this email already exists',
      );
    }
  }

  async findAll(restaurantId: string) {
    const users = await this.prisma.user.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        restaurantId: true,
        fullName: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users.map((user) => this.sanitizeStaff(user));
  }

  async getPinAuditLogs(restaurantId: string, actor: StaffActor, limit = 25) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can view PIN audit logs');
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const logs = await this.prisma.pinAuditLog.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      select: {
        id: true,
        actorUserId: true,
        staffUserId: true,
        action: true,
        status: true,
        reason: true,
        createdAt: true,
      },
    });

    const userIds = Array.from(
      new Set(logs.flatMap((entry) => [entry.actorUserId, entry.staffUserId])),
    );

    const users = await this.prisma.user.findMany({
      where: {
        restaurantId,
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        email: true,
      },
    });

    const userLookup = new Map(
      users.map((u) => [u.id, u.name || u.fullName || u.email]),
    );

    return logs.map((entry) => ({
      ...entry,
      actorName: userLookup.get(entry.actorUserId) || entry.actorUserId,
      staffName: userLookup.get(entry.staffUserId) || entry.staffUserId,
    }));
  }

  async create(restaurantId: string, dto: CreateStaffDto) {
    const name = dto.name.trim();
    const email = dto.email?.trim()
      ? this.normalizeEmail(dto.email)
      : `staff-${randomUUID()}@internal.tillcloudpos.local`;

    if (dto.email?.trim()) {
      await this.assertEmailNotTaken(restaurantId, email);
    }

    const shouldGeneratePin = this.roleRequiresPosPin(dto.role);
    const pin = shouldGeneratePin
      ? await this.generateUniquePin(restaurantId)
      : null;
    const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
    const pinEncrypted = pin ? this.encryptPin(pin) : null;

    try {
      const user = await this.prisma.user.create({
        data: {
          restaurantId,
          name,
          fullName: name,
          email,
          phone: dto.phone?.trim() || null,
          role: dto.role,
          isActive: true,
          pinHash,
          pinEncrypted,
        },
        select: {
          id: true,
          restaurantId: true,
          fullName: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        id: user.id,
        name: user.name || user.fullName,
        role: user.role,
        pin,
        staff: this.sanitizeStaff(user),
        generatedPin: pin,
      };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'A staff member with this email already exists',
        );
      }
      throw error;
    }
  }

  async update(
    restaurantId: string,
    id: string,
    actor: StaffActor,
    dto: UpdateStaffDto,
  ) {
    const target = await this.findTenantUserOrThrow(id, restaurantId);
    this.ensureAdminImmutable(target.role);

    if (
      actor.userId === target.id &&
      dto.role &&
      (dto.role as string) !== target.role
    ) {
      throw new BadRequestException('You cannot change your own role');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.email) {
      const normalizedEmail = this.normalizeEmail(dto.email);
      await this.assertEmailNotTaken(restaurantId, normalizedEmail, id);
      data.email = normalizedEmail;
    }

    if (dto.name) {
      const cleanedName = dto.name.trim();
      data.name = cleanedName;
      data.fullName = cleanedName;
    }

    if (dto.phone !== undefined) {
      data.phone = dto.phone?.trim() || null;
    }

    if (dto.role) {
      data.role = dto.role;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        restaurantId: true,
        fullName: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.sanitizeStaff(updated);
  }

  async activate(restaurantId: string, id: string) {
    const target = await this.findTenantUserOrThrow(id, restaurantId);
    this.ensureAdminImmutable(target.role);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        restaurantId: true,
        fullName: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return this.sanitizeStaff(updated);
  }

  async deactivate(restaurantId: string, id: string, actor: StaffActor) {
    const target = await this.findTenantUserOrThrow(id, restaurantId);
    this.ensureAdminImmutable(target.role);

    if (actor.userId === target.id) {
      throw new BadRequestException('You cannot deactivate yourself');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        restaurantId: true,
        fullName: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return this.sanitizeStaff(updated);
  }

  async resetPin(
    restaurantId: string,
    id: string,
    actor: StaffActor,
    adminPassword: string,
  ) {
    try {
      await this.verifyAdminActor(restaurantId, actor, adminPassword);

      const target = await this.findTenantUserOrThrow(id, restaurantId);
      this.ensureAdminImmutable(target.role);

      if (!this.roleRequiresPosPin(target.role)) {
        throw new BadRequestException(
          'PIN can only be reset for CASHIER, MANAGER, or KITCHEN roles',
        );
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        select: { pinEncrypted: true },
      });

      let previousPin: string | null = null;
      if (existingUser?.pinEncrypted) {
        try {
          previousPin = this.decryptPin(existingUser.pinEncrypted);
        } catch {
          previousPin = null;
        }
      }

      let pin = await this.generateUniquePin(restaurantId, id);
      if (previousPin && pin === previousPin) {
        let guard = 0;
        while (pin === previousPin && guard < 8) {
          pin = await this.generateUniquePin(restaurantId, id);
          guard += 1;
        }
      }

      const pinHash = await bcrypt.hash(pin, 10);
      const pinEncrypted = this.encryptPin(pin);

      await this.prisma.user.update({
        where: { id },
        data: {
          pinHash,
          pinEncrypted,
        },
      });

      await this.logPinAction(
        restaurantId,
        actor.userId,
        id,
        'RESET',
        'SUCCESS',
      );

      return {
        id,
        generatedPin: pin,
      };
    } catch (error: any) {
      await this.logPinAction(
        restaurantId,
        actor.userId,
        id,
        'RESET',
        'FAILED',
        error?.message || 'Unknown error',
      );
      throw error;
    }
  }

  async revealPin(
    restaurantId: string,
    id: string,
    actor: StaffActor,
    adminPassword: string,
  ) {
    try {
      await this.verifyAdminActor(restaurantId, actor, adminPassword);

      const target = await this.findTenantUserOrThrow(id, restaurantId);
      this.ensureAdminImmutable(target.role);

      if (!this.roleRequiresPosPin(target.role)) {
        throw new BadRequestException(
          'PIN is only available for CASHIER, MANAGER, or KITCHEN roles',
        );
      }

      const targetUser = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          pinEncrypted: true,
        },
      });

      if (!targetUser || !targetUser.pinEncrypted) {
        await this.logPinAction(
          restaurantId,
          actor.userId,
          id,
          'VIEW',
          'FAILED',
          'No stored PIN found for this staff member. Reset PIN first.',
        );
        return {
          id,
          pin: null,
          message:
            'No stored PIN found for this staff member. Reset PIN first.',
        };
      }

      const pin = this.decryptPin(targetUser.pinEncrypted);
      await this.logPinAction(
        restaurantId,
        actor.userId,
        id,
        'VIEW',
        'SUCCESS',
      );
      return {
        id,
        pin,
      };
    } catch (error: any) {
      await this.logPinAction(
        restaurantId,
        actor.userId,
        id,
        'VIEW',
        'FAILED',
        error?.message || 'Unknown error',
      );
      throw error;
    }
  }

  async remove(restaurantId: string, id: string, actor: StaffActor) {
    const target = await this.findTenantUserOrThrow(id, restaurantId);
    this.ensureAdminImmutable(target.role);

    if (actor.userId === target.id) {
      throw new BadRequestException('You cannot delete yourself');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }
}
