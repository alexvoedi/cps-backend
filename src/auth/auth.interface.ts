import { UserRole } from '@prisma/client';

export interface TokenPayload {
  id: string;
  role: UserRole;
}
