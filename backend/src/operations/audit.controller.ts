import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { GetUser } from '../auth/decorators/get-user.decorator';

interface RequestWithUser {
  user?: {
    userId: string;
    email: string;
    restaurantId: string;
    role: string;
  };
}

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  async createLog(
    @GetUser() user: any,
    @Body()
    body: {
      action: string;
      details?: string;
      ipAddress?: string;
      userAgent?: string;
    },
  ) {
    if (!body?.action) {
      throw new BadRequestException('action is required');
    }
    return this.auditService.createLog(
      user.userId,
      user.restaurantId,
      body.action,
      body.details,
      body.ipAddress,
      body.userAgent,
    );
  }

  @Get()
  async getLogs(
    @GetUser() user: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    const lim = limit ? parseInt(limit, 10) : 50;
    const off = offset ? parseInt(offset, 10) : 0;
    return this.auditService.fetchLogs(
      user.restaurantId,
      lim,
      off,
      action,
      userId,
    );
  }
}
