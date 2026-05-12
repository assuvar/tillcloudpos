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

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps, postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const allowedList = configuredOrigins
        ? configuredOrigins.split(',').map((o) => o.trim().replace(/\/$/, ''))
        : [];

      // Unconditionally allow localhost, tillcloud.com.au, and any tillcloud.com.au subdomains
      const isAllowed =
        allowedList.includes(origin) ||
        origin === 'https://test.tillcloud.com.au' ||
        origin === 'https://tillcloud.com.au' ||
        /\.tillcloud\.com\.au$/.test(origin) ||
        origin.startsWith('http://localhost:') ||
        !configuredOrigins;

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
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
        '/tables',
        '/users',
        '/onboarding',
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
