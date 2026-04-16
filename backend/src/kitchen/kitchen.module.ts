import { Module } from '@nestjs/common';
import { BillsModule } from '../bills/bills.module';
import { KitchenController } from './kitchen.controller';
import { KitchenService } from './kitchen.service';

@Module({
  imports: [BillsModule],
  controllers: [KitchenController],
  providers: [KitchenService],
})
export class KitchenModule {}
