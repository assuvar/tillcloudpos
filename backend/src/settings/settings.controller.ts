import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  CreatePrinterSettingsDto,
  UpdatePrinterSettingsDto,
} from './dto/printer-settings.dto';
import { UpdateKotSettingsDto } from './dto/kot-settings.dto';
import { UpdateBillSettingsDto } from './dto/bill-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('printers')
  getPrinters(@Request() req: any) {
    return this.settingsService.getPrinters(req.user.restaurantId);
  }

  @Post('printers')
  addPrinter(@Request() req: any, @Body() dto: CreatePrinterSettingsDto) {
    return this.settingsService.addPrinter(req.user.restaurantId, dto);
  }

  @Put('printers/:id')
  updatePrinter(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePrinterSettingsDto,
  ) {
    return this.settingsService.updatePrinter(id, req.user.restaurantId, dto);
  }

  @Delete('printers/:id')
  deletePrinter(@Request() req: any, @Param('id') id: string) {
    return this.settingsService.deletePrinter(id, req.user.restaurantId);
  }

  @Get('kot')
  getKotSettings(@Request() req: any) {
    return this.settingsService.getKotSettings(req.user.restaurantId);
  }

  @Put('kot')
  updateKotSettings(@Request() req: any, @Body() dto: UpdateKotSettingsDto) {
    return this.settingsService.updateKotSettings(req.user.restaurantId, dto);
  }

  @Get('bill')
  getBillSettings(@Request() req: any) {
    return this.settingsService.getBillSettings(req.user.restaurantId);
  }

  @Put('bill')
  updateBillSettings(@Request() req: any, @Body() dto: UpdateBillSettingsDto) {
    return this.settingsService.updateBillSettings(req.user.restaurantId, dto);
  }
}
