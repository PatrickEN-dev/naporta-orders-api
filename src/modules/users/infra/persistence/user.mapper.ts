import type { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.restore({
      id: raw.id,
      email: raw.email,
      passwordHash: raw.passwordHash,
      refreshTokenHash: raw.refreshTokenHash,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
