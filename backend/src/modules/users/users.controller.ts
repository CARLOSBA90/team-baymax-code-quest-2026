import { Controller, Get } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { Session as UserSession } from '../../auth/auth.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /api/users/me. Requiere sesión; sin ella el guard responde 401. */
  @Get('me')
  getProfile(@Session() session: UserSession) {
    return this.usersService.getProfile(session.user);
  }
}
