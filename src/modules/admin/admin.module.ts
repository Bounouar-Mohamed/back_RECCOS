import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersController } from './admin-users.controller';
import { UsersService } from '../users/users.service';
import { User } from '../../database/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigModule, AuthModule],
  controllers: [AdminUsersController],
  providers: [UsersService],
})
export class AdminModule {}





