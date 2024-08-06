import { UserRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateUserDto {
  @IsEnum(UserRole)
  role?: UserRole;
}
