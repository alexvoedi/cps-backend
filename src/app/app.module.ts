import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AuthModule } from 'src/auth/auth.module';
import { GoogleAuthModule } from 'src/auth/google/google-auth.module';
import { CharacterModule } from 'src/character/character.module';
import { HealthModule } from 'src/health/health.module';
import { PriorityListModule } from 'src/priority-list/priority-list.module';
import { UserModule } from 'src/user/user.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        BASE_URL: Joi.string().uri().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().min(16).required(),
        POSTGRES_DB: Joi.string().required(),
        GOOGLE_AUTH_CLIENT_ID: Joi.string().required(),
        GOOGLE_AUTH_CLIENT_SECRET: Joi.string().min(16).required(),
        COOKIE_SECRET: Joi.string().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().min(16).required(),
        JWT_EXPIRATION_TIME: Joi.number().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.number().required(),
        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.number().port().required(),
        MAIL_USER: Joi.string().required(),
        MAIL_PASS: Joi.string().required(),
        FRONTEND_URL: Joi.string().uri().required(),
        ADMIN_EMAIL: Joi.string().email().required(),
      }),
      cache: true,
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    AuthModule,
    GoogleAuthModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        // secure: true,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: `cohors praetoria spei <${process.env.MAIL_USER}>`,
      },
      preview: process.env.NODE_ENV !== 'production',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1_000,
        limit: 300,
      },
    ]),
    UserModule,
    CharacterModule,
    PriorityListModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
