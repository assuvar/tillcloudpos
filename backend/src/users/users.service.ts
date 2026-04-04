import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(restaurantId: string, createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto as any;
    let passwordHash = null;
    
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        restaurantId,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
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
    const { password, ...updateData } = updateUserDto as any;
    const data = { ...updateData };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
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
