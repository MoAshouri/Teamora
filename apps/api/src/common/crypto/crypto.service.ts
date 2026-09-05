import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

@Injectable()
export class CryptoService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateInviteCode(): string {
    return String(randomInt(100000, 999999));
  }

  generateOtpCode(): string {
    return String(randomInt(100000, 999999));
  }
}
