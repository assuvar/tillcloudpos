import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { MenuModule } from './menu/menu.module';
import { BillsModule } from './bills/bills.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { StaffModule } from './staff/staff.module';
import { PermissionsModule } from './permissions/permissions.module';
import { InventoryModule } from './inventory/inventory.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ReportsModule } from './reports/reports.module';
import { MailModule } from './mail/mail.module';
import { TablesModule } from './tables/tables.module';
import { ReservationsModule } from './reservations/reservations.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    StaffModule,
    PermissionsModule,
    RestaurantModule,
    OnboardingModule,
    ReportsModule,
    InventoryModule,
    ProductsModule,
    CategoriesModule,
    MenuModule,
    BillsModule,
    KitchenModule,
    PaymentsModule,
    OrdersModule,
    MailModule,
    TablesModule,
    ReservationsModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: Request, res: Response, next: NextFunction) => {
        Logger.log(`[Request] ${req.method} ${req.originalUrl}`, 'AppModule');
        next();
      })
      .forRoutes('*');
  }
}
