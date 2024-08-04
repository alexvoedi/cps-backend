import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailerService,
  ) {
    this.createAdminUser();
  }

  async getUser(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async getUsers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    const newUser = this.prisma.user.create({
      data,
    });

    this.mailService.sendMail({
      from: 'CPS Website',
      to: 'voedisch.alexander@gmail.com',
      subject: 'Neuer Nutzer | CPS',
      text: `Ein neuer Nutzer hat sich auf der CPS Webseite registriert. Besuche jetzt ${this.configService.get('FRONTEND_URL')} um dem Nutzer eine Rolle zuzuweisen.`,
    });

    return newUser;
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { currentHashedRefreshToken },
    });
  }

  async removeRefreshToken(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { currentHashedRefreshToken: null },
    });
  }

  isPasswordValid(user: User, password: string): boolean {
    return bcrypt.compareSync(password, user.hashedPassword);
  }

  async createAdminUser() {
    const adminExists = await this.prisma.user.findUnique({
      where: {
        email: this.configService.get('ADMIN_EMAIL'),
        role: UserRole.Admin,
      },
    });

    if (!adminExists) {
      const password = this.generatePassword();

      await this.prisma.user.create({
        data: {
          email: this.configService.get('ADMIN_EMAIL'),
          name: 'Admin',
          role: UserRole.Admin,
          hashedPassword: bcrypt.hashSync(password, 10),
        },
      });

      await this.mailService.sendMail({
        from: 'CPS Website',
        to: this.configService.get('ADMIN_EMAIL'),
        subject: 'Admin Account erstellt',
        text: `Admin-Account mit dem Passwort "${password}" wurde erstellt.`,
      });

      this.logger.log('New admin user created');
    }
  }

  generatePassword(length = 16) {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let password = '';

    for (let i = 0; i < length; i++) {
      const at = Math.floor(Math.random() * charset.length);
      password += charset.charAt(at);
    }

    return password;
  }
}
