import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as Joi from 'joi';
import { AuthModule } from 'src/auth/auth.module';
import { GoogleAuthModule } from 'src/auth/google/google-auth.module';
import { CharacterModule } from 'src/character/character.module';
import { HealthModule } from 'src/health/health.module';
import { SuicideKingModule } from 'src/suicide-king/suicide-king.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        GOOGLE_AUTH_CLIENT_ID: Joi.string().required(),
        GOOGLE_AUTH_CLIENT_SECRET: Joi.string().required(),
        COOKIE_SECRET: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.number().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.number().required(),
        MAIL_USER: Joi.string().required(),
        MAIL_PASS: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
      }),
      cache: true,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: `${configService.get<number>('JWT_EXPIRATION_TIME')}s`,
          },
        };
      },
    }),
    HealthModule,
    AuthModule,
    GoogleAuthModule,
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        host: 'smpt.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
    }),
    UserModule,
    CharacterModule,
    SuicideKingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
