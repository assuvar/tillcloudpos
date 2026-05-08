import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';

import { VariationsService } from './variations.service';
import { VariationsController } from './variations.controller';
import { AddonsService } from './addons.service';
import { AddonsController } from './addons.controller';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';

@Module({
  imports: [PrismaModule, CategoriesModule, ProductsModule],
  controllers: [
    MenuController,
    VariationsController,
    AddonsController,
    GroupsController,
    DealsController,
  ],
  providers: [
    MenuService,
    VariationsService,
    AddonsService,
    GroupsService,
    DealsService,
  ],
})
export class MenuModule {}
