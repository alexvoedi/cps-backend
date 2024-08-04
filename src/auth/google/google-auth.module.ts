import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { GoogleAuthController } from 'src/auth/google/google-auth.controller';
import { GoogleAuthService } from 'src/auth/google/google-auth.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [GoogleAuthController],
  providers: [GoogleAuthService, ConfigService],
  exports: [],
})
export class GoogleAuthModule {}
