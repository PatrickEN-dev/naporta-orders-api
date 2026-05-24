import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../users/domain/repositories/user.repository';

@Injectable()
export class SignOutUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  execute(userId: string): Promise<void> {
    return this.users.updateRefreshToken(userId, null);
  }
}
