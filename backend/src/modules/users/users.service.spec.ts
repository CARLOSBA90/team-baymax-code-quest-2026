import type { Session } from '../auth/auth.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  const service = new UsersService();

  const createUser = (
    overrides: Partial<Session['user']> = {},
  ): Session['user'] => ({
    id: 'user-1',
    name: 'Baymax',
    email: 'baymax@example.com',
    emailVerified: true,
    image: 'https://example.com/baymax.png',
    createdAt: new Date('2026-09-18T00:00:00.000Z'),
    updatedAt: new Date('2026-09-19T00:00:00.000Z'),
    ...overrides,
  });

  it('returns only the public profile fields from the session user', () => {
    const user = createUser();

    expect(service.getProfile(user)).toEqual({
      data: {
        id: 'user-1',
        name: 'Baymax',
        email: 'baymax@example.com',
        image: 'https://example.com/baymax.png',
      },
    });
  });

  it.each([null, undefined])('normalizes a %s image to null', (image) => {
    expect(service.getProfile(createUser({ image })).data.image).toBeNull();
  });

  it('preserves an empty image string instead of treating it as absent', () => {
    expect(service.getProfile(createUser({ image: '' })).data.image).toBe('');
  });

  it('does not leak authentication metadata from the session user', () => {
    const profile = service.getProfile(createUser());

    expect(profile.data).not.toHaveProperty('emailVerified');
    expect(profile.data).not.toHaveProperty('createdAt');
    expect(profile.data).not.toHaveProperty('updatedAt');
  });
});
