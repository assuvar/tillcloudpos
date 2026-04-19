import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions.constants';
import { ReportsService } from './reports.service';

const getRestaurantId = (req: any): string => {
  if (req.user?.restaurantId) {
    return req.user.restaurantId;
  }

  throw new ForbiddenException('Restaurant context is required');
};

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @RequirePermissions(PERMISSIONS.REPORTS_VIEW)
  summary(@Req() req: any) {
    return this.reportsService.getSummary(getRestaurantId(req));
  }

  @Get('analytics')
  @RequirePermissions(PERMISSIONS.REPORTS_VIEW)
  analytics(@Req() req: any) {
    return this.reportsService.getAnalytics(getRestaurantId(req));
  }

  @Post('close-day')
  @RequirePermissions(PERMISSIONS.REPORTS_MANAGE)
  closeDay(
    @Req() req: any,
    @Body() body?: { businessDate?: string },
  ) {
    return this.reportsService.closeDay(
      getRestaurantId(req),
      req.user?.userId || null,
      {
        businessDate: body?.businessDate,
      },
    );
  }

  @Get('export')
  @RequirePermissions(PERMISSIONS.REPORTS_EXPORT)
  async export(
    @Req() req: any,
    @Query('format') format: string | undefined,
    @Res() res: Response,
  ) {
    if ((format || 'csv').toLowerCase() !== 'csv') {
      throw new BadRequestException('Only CSV export is supported');
    }

    const csv = await this.reportsService.exportCsv(getRestaurantId(req));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${csv.filename}"`,
    );
    res.status(200).send(csv.content);
  }
}
