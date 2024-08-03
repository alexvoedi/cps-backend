import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { TokenPayload } from 'src/auth/auth.interface';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async getCookiesForUser(user: User) {
    const accessTokenCookie = this.getCookieWithJwtToken(user);

    const { cookie: refreshTokenCookie, token: refreshToken } =
      this.getCookieWithJwtRefreshToken(user);

    await this.userService.setCurrentRefreshToken(refreshToken, user.id);

    return {
      accessTokenCookie,
      refreshTokenCookie,
    };
  }

  public getCookieWithJwtToken(user: User) {
    const payload: TokenPayload = { id: user.id, role: user.role };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: `${this.configService.get('JWT_EXPIRATION_TIME')}s`,
    });

    const cookie = `Authentication=${token}; Path=/; Max-Age=${this.configService.get('JWT_EXPIRATION_TIME')}; SameSite=None; Secure`;

    return cookie;
  }

  public getCookieWithJwtRefreshToken(user: User) {
    const payload: TokenPayload = { id: user.id, role: user.role };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}s`,
    });

    const cookie = `Refresh=${token}; Path=/; Max-Age=${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}; SameSite=None; Secure`;

    return {
      cookie,
      token,
    };
  }

  clearCookie() {
    return [
      `Authentication=; Path=/; Max-Age=0`,
      `Refresh=; Path=/; Max-Age=0`,
    ];
  }

  async getUserFromToken(token: string) {
    const user = await this.userService.getUser({
      id: await this.getUserIdFromToken(token),
    });

    return user;
  }

  async getUserIdFromToken(token: string) {
    const { id: userId } = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
    });

    return userId;
  }
}
