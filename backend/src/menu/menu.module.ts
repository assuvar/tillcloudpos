import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, CategoriesModule, ProductsModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
