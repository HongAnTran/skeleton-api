import { Module } from '@nestjs/common';
import { UserAdminsController } from './user-admins.controller';
import { UserAdminsService } from './user-admins.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UserAdminsController],
  providers: [UserAdminsService],
  exports: [UserAdminsService],
})
export class UserAdminsModule {}
