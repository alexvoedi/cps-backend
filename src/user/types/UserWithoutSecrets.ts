import { User } from '@prisma/client';

export type UserWithoutSecrets = Omit<
  User,
  'currentHashedRefreshToken' | 'hashedPassword'
>;
