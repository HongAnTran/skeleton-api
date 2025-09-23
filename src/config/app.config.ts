import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  cors: {
    enabled: boolean;
    origin: string[];
  };
  helmet: {
    enabled: boolean;
  };
  swagger: {
    enabled: boolean;
    path: string;
  };
}

export default registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    cors: {
      enabled: process.env.APP_CORS_ENABLED === 'true',
      origin: process.env.APP_CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
      ],
    },
    helmet: {
      enabled: true,
    },
    swagger: {
      enabled: true,
      path: 'docs',
    },
  }),
);
