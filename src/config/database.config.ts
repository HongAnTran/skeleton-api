import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
  logging: boolean;
}

export default registerAs(
  'database',
  (): DatabaseConfig => ({
    url: process.env.DATABASE_URL,
    logging:
      process.env.DATABASE_LOGGING === 'true' ||
      process.env.NODE_ENV === 'development',
  }),
);
