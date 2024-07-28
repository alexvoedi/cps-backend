import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserController } from 'src/user/user.controller';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [MailerModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, ConfigService],
  exports: [UserService],
})
export class UserModule {}
