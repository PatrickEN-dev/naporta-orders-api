import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infra/prisma/prisma.service';
import type { User } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { UserMapper } from './user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.findOne({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async updateRefreshToken(userId: string, refreshTokenHash: string | null): Promise<void> {
    await this.prisma.db.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  private async findOne(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
    const raw = await this.prisma.db.user.findUnique({ where });
    return raw ? UserMapper.toDomain(raw) : null;
  }
}
