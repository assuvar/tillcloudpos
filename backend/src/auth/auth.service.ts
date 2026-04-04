import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(pass, user.passwordHash);
      if (isMatch) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      restaurantId: user.restaurantId,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        restaurantId: user.restaurantId,
        onboardingCompleted: user.onboardingCompleted
      }
    };
  }

  async register(registrationData: any) {
    if (!registrationData?.email || !registrationData?.password || !registrationData?.businessName) {
      throw new BadRequestException('email, password and businessName are required');
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: registrationData.businessName,
          streetAddress: '',
          suburb: '',
          postcode: '',
        },
      });

      const passwordHash = await bcrypt.hash(registrationData.password, 10);

      return tx.user.create({
        data: {
          email: registrationData.email,
          fullName: registrationData.fullName,
          role: 'ADMIN',
          passwordHash,
          restaurantId: restaurant.id,
        },
      });
    });

    return this.login(user);
  }
}
