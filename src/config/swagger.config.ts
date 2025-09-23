import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export const createSwaggerConfig = (): Omit<OpenAPIObject, 'paths'> => {
  return new DocumentBuilder()
    .setTitle('Skeleton API')
    .setDescription(
      'A modern, scalable NestJS API skeleton with comprehensive features',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-KEY',
        in: 'header',
        description: 'API Key authentication',
      },
      'api-key',
    )
    .addServer(
      process.env.API_URL || 'http://localhost:3000',
      'Development server',
    )
    .addTag('App', 'Application endpoints')
    .addTag('Health', 'Health check endpoints')
    .addTag('Users', 'User management endpoints')
    .setContact('API Support', 'https://example.com', 'support@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();
};
