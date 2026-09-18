import { Controller, Get } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { Session as UserSession } from '../../auth/auth.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users/me
   * Protegido por el guard global de AuthModule: sin sesión responde 401.
   */
  @Get('me')
  getProfile(@Session() session: UserSession) {
    return this.usersService.getProfile(session.user);
  }
}
