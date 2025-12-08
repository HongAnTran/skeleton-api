import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { KiotVietController } from './controllers/kiotviet.controller';
import { KiotVietService } from './services/kiotviet.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [KiotVietController],
  providers: [KiotVietService],
  exports: [KiotVietService],
})
export class KiotVietModule {}
