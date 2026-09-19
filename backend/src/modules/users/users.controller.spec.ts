import { Test, TestingModule } from '@nestjs/testing';
import type { Session } from '../auth/auth.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { getProfile: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    usersService = {
      getProfile: vi.fn().mockReturnValue({
        data: {
          id: 'user-1',
          name: 'Baymax',
          email: 'baymax@example.com',
          image: null,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('passes the authenticated session user to UsersService', () => {
    const user = {
      id: 'user-1',
      name: 'Baymax',
      email: 'baymax@example.com',
      emailVerified: false,
      image: null,
      createdAt: new Date('2026-09-18T00:00:00.000Z'),
      updatedAt: new Date('2026-09-19T00:00:00.000Z'),
    } satisfies Session['user'];
    const session = { user } as Session;

    expect(controller.getProfile(session)).toEqual({
      data: {
        id: 'user-1',
        name: 'Baymax',
        email: 'baymax@example.com',
        image: null,
      },
    });
    expect(usersService.getProfile).toHaveBeenCalledExactlyOnceWith(user);
  });
});
