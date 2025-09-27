import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';
import { createSwaggerConfig } from './config/swagger.config';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const appConfig = configService.get<AppConfig>('app');

    app.useGlobalFilters(new AllExceptionsFilter());

    if (appConfig.helmet.enabled) {
      app.use(
        helmet({
          contentSecurityPolicy: false,
        }),
      );
      logger.log('✅ Helmet security headers enabled');
    }

    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
    });
    logger.log('✅ CORS enabled for origins: *');

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    if (appConfig.swagger.enabled) {
      const swaggerConfig = createSwaggerConfig();
      const document = SwaggerModule.createDocument(app, swaggerConfig);
      SwaggerModule.setup(appConfig.swagger.path, app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
        },
      });
      logger.log(
        `✅ Swagger documentation available at /${appConfig.swagger.path}`,
      );
    }

    app.get(PrismaService);

    const port = appConfig.port;
    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(
      `📚 API Documentation: http://localhost:${port}/${appConfig.swagger.path}`,
    );
    logger.log(`🔍 Health Check: http://localhost:${port}/health`);
    logger.log(`🏃 Readiness Check: http://localhost:${port}/health/ready`);
  } catch (error) {
    logger.error('❌ Failed to start application', error);
  }
}

bootstrap();
