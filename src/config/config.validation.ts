import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  validateSync,
  IsOptional,
  Min,
  Max,
  IsBoolean,
  IsUrl,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL: string;

  @IsBoolean()
  @IsOptional()
  DATABASE_LOGGING: boolean = false;

  @IsString()
  @IsOptional()
  JWT_SECRET: string;

  @IsBoolean()
  @IsOptional()
  APP_CORS_ENABLED: boolean = true;

  @IsString()
  @IsOptional()
  APP_CORS_ORIGIN: string;

  @IsBoolean()
  @IsOptional()
  APP_HELMET_ENABLED: boolean = true;

  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED: boolean = true;

  @IsString()
  @IsOptional()
  SWAGGER_PATH: string = 'docs';

  @IsUrl({ require_tld: false })
  @IsOptional()
  API_URL: string;

  @IsNumber()
  @IsOptional()
  THROTTLE_TTL: number = 60;

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT: number = 10;

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsNumber()
  @IsOptional()
  HEALTH_CHECK_TIMEOUT: number = 5000;

  @IsString()
  @IsOptional()
  KIOTVIET_RETAILER: string;

  @IsString()
  @IsOptional()
  KIOTVIET_CLIENT_ID: string;

  @IsString()
  @IsOptional()
  KIOTVIET_CLIENT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
