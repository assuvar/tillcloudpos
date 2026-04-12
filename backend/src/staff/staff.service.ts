import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/permissions/permissions.constants';
import { CreateStaffDto, StaffRole, UpdateStaffDto } from './dto/staff-common.dto';

type StaffActor = {
  userId: string;
  role: UserRole;
  restaurantId: string;
};

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private generatePin() {
    const pinLength = Math.floor(Math.random() * 3) + 4;
    const maxValue = 10 ** pinLength;
    return Math.floor(Math.random() * maxValue)
      .toString()
      .padStart(pinLength, '0');
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

    if (!user || user.restaurantId !== restaurantId) {
      throw new NotFoundException('Staff member not found');
    }

    return user;
  }

  private ensureAdminImmutable(targetRole: string) {
    if (targetRole === StaffRole.ADMIN) {
      throw new ForbiddenException('Admin account cannot be modified here');
    }
  }

  private async assertEmailNotTaken(restaurantId: string, email: string, excludeId?: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        restaurantId,
        email: this.normalizeEmail(email),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('A staff member with this email already exists');
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

  async create(restaurantId: string, dto: CreateStaffDto) {
    const email = this.normalizeEmail(dto.email);
    const name = dto.name.trim();
    await this.assertEmailNotTaken(restaurantId, email);

    const pin = this.generatePin();
    const pinHash = await bcrypt.hash(pin, 10);

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
        staff: this.sanitizeStaff(user),
        generatedPin: pin,
      };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('A staff member with this email already exists');
      }
      throw error;
    }
  }

  async update(restaurantId: string, id: string, actor: StaffActor, dto: UpdateStaffDto) {
    const target = await this.findTenantUserOrThrow(id, restaurantId);
    this.ensureAdminImmutable(target.role);

    if (actor.userId === target.id && dto.role && dto.role !== target.role) {
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

  async resetPin(restaurantId: string, id: string) {
    const target = await this.findTenantUserOrThrow(id, restaurantId);
    this.ensureAdminImmutable(target.role);

    const pin = this.generatePin();
    const pinHash = await bcrypt.hash(pin, 10);

    await this.prisma.user.update({
      where: { id },
      data: { pinHash },
    });

    return {
      id,
      generatedPin: pin,
    };
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
