import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from 'src/auth/auth.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get('roles', context.getHandler());

    if (!roles) {
      return true;
    }

    const { handshake } = context.switchToWs().getClient();

    // get Refresh auth header
    const cookies: string[] = handshake.headers.cookie.split('; ');

    const refreshTokenCookie = cookies.find((cookie) =>
      cookie.startsWith('Refresh='),
    );

    if (!refreshTokenCookie) {
      return false;
    }

    const refreshToken = refreshTokenCookie.split('=')[1];

    if (!refreshToken) {
      return false;
    }

    const { role } = this.jwtService.verify<TokenPayload>(refreshToken, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
    });

    if (!role) {
      return false;
    }

    if (!roles.includes(role)) {
      return false;
    }

    return true;
  }
}
