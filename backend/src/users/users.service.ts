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

    return this.prisma.user.create({
      data: {
        ...userData,
        email: createUserDto.email.trim().toLowerCase(),
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

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
