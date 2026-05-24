import { User } from '../domain/entities/user.entity';
import type { UserRepository } from '../domain/repositories/user.repository';

interface UserSnapshot {
  id: string;
  email: string;
  passwordHash: string;
  refreshTokenHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly snapshots = new Map<string, UserSnapshot>();

  get users(): Map<string, User> {
    return new Map(
      [...this.snapshots.entries()].map(([id, snapshot]) => [id, User.restore(snapshot)]),
    );
  }

  set(user: User): void {
    this.snapshots.set(user.id, {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      refreshTokenHash: user.refreshTokenHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  findById(id: string): Promise<User | null> {
    const snapshot = this.snapshots.get(id);
    return Promise.resolve(snapshot ? User.restore(snapshot) : null);
  }

  findByEmail(email: string): Promise<User | null> {
    const snapshot = [...this.snapshots.values()].find((s) => s.email === email);
    return Promise.resolve(snapshot ? User.restore(snapshot) : null);
  }

  updateRefreshToken(userId: string, refreshTokenHash: string | null): Promise<void> {
    const snapshot = this.snapshots.get(userId);
    if (snapshot) {
      this.snapshots.set(userId, { ...snapshot, refreshTokenHash });
    }
    return Promise.resolve();
  }
}
