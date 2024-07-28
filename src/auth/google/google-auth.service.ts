import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { google, Auth } from 'googleapis';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GoogleAuthService {
  oauthClient: Auth.OAuth2Client;

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_AUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'GOOGLE_AUTH_CLIENT_SECRET',
    );

    this.oauthClient = new google.auth.OAuth2(clientId, clientSecret);
  }

  async authenticate(token: string) {
    const tokenInfo = await this.oauthClient.getTokenInfo(token);

    const { email } = tokenInfo;

    const user = await this.userService.getUser({ email });

    if (!user) {
      return this.registerUser(token, email);
    }

    return this.handleRegisteredUser(user);
  }

  async verify(refreshToken: string) {
    const user = this.authService.getUserFromToken(refreshToken);

    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    return user;
  }

  async handleRegisteredUser(user: User) {
    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    const { accessTokenCookie, refreshTokenCookie } =
      await this.authService.getCookiesForUser(user);

    return {
      user,
      accessTokenCookie,
      refreshTokenCookie,
    };
  }

  async registerUser(token: string, email: string) {
    const { name } = await this.getUserData(token);

    const user = await this.userService.createUser({
      email,
      name,
    });

    return this.handleRegisteredUser(user);
  }

  async getUserData(token: string) {
    const { userinfo } = google.oauth2('v2');

    this.oauthClient.setCredentials({ access_token: token });

    const { data } = await userinfo.get({ auth: this.oauthClient });

    return data;
  }

  async signOut(token: string) {
    const userId = await this.authService.getUserIdFromToken(token);

    await this.userService.removeRefreshToken(userId);

    return this.authService.clearCookie();
  }
}
