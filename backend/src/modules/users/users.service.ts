import { Injectable } from '@nestjs/common';
import type { Session } from '../../auth/auth.js';

@Injectable()
export class UsersService {
  getProfile(user: Session['user']) {
    return {
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      },
    };
  }
}
