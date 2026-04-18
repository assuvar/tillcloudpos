import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, createUserDto: CreateUserDto) {
    const { password, pin, ...userData } = createUserDto;
    let passwordHash = null;
    let pinHash = null;

    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    if (pin) {
      if (!/^\d{4}$/.test(pin)) {
        throw new BadRequestException('PIN must be exactly 4 digits');
      }
      pinHash = await bcrypt.hash(pin, 10);
    }

    const normalizedName =
      createUserDto.fullName?.trim() || createUserDto.name?.trim();

    return this.prisma.user.create({
      data: {
        ...userData,
        name: normalizedName,
        fullName: normalizedName || createUserDto.email.trim().toLowerCase(),
        email: createUserDto.email.trim().toLowerCase(),
        phone: createUserDto.phone?.trim() || null,
        passwordHash,
        pinHash,
        restaurantId,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.trim().toLowerCase() },
      include: { restaurant: true },
    });
  }

  findByEmailInRestaurant(email: string, restaurantId: string) {
    return this.prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        restaurantId,
      },
      include: { restaurant: true },
    });
  }

  findAll(restaurantId: string) {
    return this.prisma.user.findMany({
      where: { restaurantId },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { restaurant: true },
    });
  }

  findOneInRestaurant(id: string, restaurantId: string) {
    return this.prisma.user.findFirst({
      where: {
        id,
        restaurantId,
      },
      include: { restaurant: true },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, pin, email, ...updateData } =
      updateUserDto as UpdateUserDto & { password?: string; pin?: string };
    const data: Record<string, unknown> = { ...updateData };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    if (pin) {
      if (!/^\d{4}$/.test(pin)) {
        throw new BadRequestException('PIN must be exactly 4 digits');
      }
      data.pinHash = await bcrypt.hash(pin, 10);
    }

    if (email) {
      data.email = email.trim().toLowerCase();
    }

    if (updateUserDto.fullName || updateUserDto.name) {
      const normalizedName =
        updateUserDto.fullName?.trim() || updateUserDto.name?.trim();
      data.fullName = normalizedName;
      data.name = normalizedName;
    }

    if (updateUserDto.phone !== undefined) {
      data.phone = updateUserDto.phone?.trim() || null;
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateInRestaurant(
    id: string,
    restaurantId: string,
    updateUserDto: UpdateUserDto,
  ) {
    const targetUser = await this.findOneInRestaurant(id, restaurantId);
    if (!targetUser) {
      throw new BadRequestException('User not found in restaurant context');
    }

    return this.update(id, updateUserDto);
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async removeInRestaurant(id: string, restaurantId: string) {
    const targetUser = await this.findOneInRestaurant(id, restaurantId);
    if (!targetUser) {
      throw new BadRequestException('User not found in restaurant context');
    }

    return this.remove(id);
  }
}
