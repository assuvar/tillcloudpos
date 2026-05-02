import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PrintingService } from './printing.service';

@Module({
  providers: [SettingsService, PrintingService],
  controllers: [SettingsController],
  exports: [SettingsService, PrintingService],
})
export class SettingsModule {}
