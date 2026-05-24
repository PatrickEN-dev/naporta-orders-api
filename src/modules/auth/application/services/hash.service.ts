import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash, timingSafeEqual } from 'node:crypto';

@Injectable()
export class HashService {
  hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  verifyPassword(hashValue: string, plain: string): Promise<boolean> {
    return argon2.verify(hashValue, plain);
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  matchesToken(hashValue: string, token: string): boolean {
    const expected = Buffer.from(hashValue, 'hex');
    const actual = Buffer.from(this.hashToken(token), 'hex');
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }
}
