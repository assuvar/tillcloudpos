import * as dotenv from 'dotenv';
import * as path from 'path';
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

// Load environment variables from .env file in the backend directory
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const configuredOrigins = configService.get<string>('FRONTEND_URL');
  const allowedOrigins = configuredOrigins
    ? configuredOrigins.split(',').map((origin) => origin.trim())
    : true;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.method !== 'GET') {
        return next();
      }

      const pathName = req.path || '';
      const isApiRequest = [
        '/auth',
        '/categories',
        '/products',
        '/inventory',
        '/menu',
        '/bills',
        '/kitchen',
        '/payments',
        '/orders',
        '/permissions',
        '/restaurant',
        '/users',
      ].some(
        (prefix) => pathName === prefix || pathName.startsWith(`${prefix}/`),
      );

      if (isApiRequest || pathName.startsWith('/uploads')) {
        return next();
      }

      if (req.accepts(['html']) && configuredOrigins) {
        const frontendUrl = configuredOrigins.split(',')[0]?.trim();
        if (frontendUrl) {
          return res.redirect(302, `${frontendUrl}${req.originalUrl}`);
        }
      }

      return next();
    },
  );

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const port = configService.get<number>('PORT') || 3100;
  await app.listen(port);
}
bootstrap();
