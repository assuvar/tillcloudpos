import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { RegisterService } from './register.service';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('register-sessions')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Post('open')
  async openRegister(
    @GetUser() user: any,
    @Body() body: { terminalId?: string; openingCash: number },
  ) {
    return this.registerService.openRegister(
      user.userId,
      user.restaurantId,
      body.terminalId || null,
      body.openingCash,
    );
  }

  @Post('close')
  async closeRegister(
    @GetUser() user: any,
    @Body() body: { closingCash: number },
  ) {
    return this.registerService.closeRegister(
      user.userId,
      user.restaurantId,
      body.closingCash,
    );
  }

  @Get('active')
  async getActiveRegister(@GetUser() user: any) {
    const activeSession = await this.registerService.getActiveRegister(
      user.userId,
      user.restaurantId,
    );
    return { session: activeSession };
  }
}
