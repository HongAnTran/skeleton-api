import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DahahiController } from './controllers/dahahi.controller';
import { DahahiService } from './services/dahahi.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [DahahiController],
  providers: [DahahiService],
  exports: [DahahiService],
})
export class DahahiModule {}
