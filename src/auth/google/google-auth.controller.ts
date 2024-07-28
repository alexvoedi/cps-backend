import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { TokenVerificationDto } from 'src/auth/dtos/token-verification.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { GoogleAuthService } from 'src/auth/google/google-auth.service';

@Controller('auth/google')
@UseInterceptors(ClassSerializerInterceptor)
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Post('login')
  async authenticate(
    @Body() tokenData: TokenVerificationDto,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    const { accessTokenCookie, refreshTokenCookie, user } =
      await this.googleAuthService.authenticate(tokenData.token);

    response.header('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);

    return user;
  }

  @Post('verify')
  async verify(@Req() { cookies }: FastifyRequest) {
    const { Refresh: refreshToken } = cookies;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing credentials');
    }

    const user = await this.googleAuthService.verify(refreshToken);

    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    if (!user.currentHashedRefreshToken) {
      throw new UnauthorizedException('User not logged in');
    }

    return user;
  }

  @Post('logout')
  async logout(
    @Req() { cookies }: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    const { Refresh: refreshToken } = cookies;

    const cookie = await this.googleAuthService.signOut(refreshToken);

    response.header('Set-Cookie', cookie);

    return {
      message: 'Logged out successfully',
    };
  }
}
