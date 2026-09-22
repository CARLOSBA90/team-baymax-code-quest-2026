import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard.js';

describe('AdminGuard', () => {
  const originalAdminEmails = process.env.ADMIN_EMAILS;
  const guard = new AdminGuard();

  const contextFor = (session: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ session }) }),
    }) as unknown as ExecutionContext;

  const sessionOf = (email: string) => ({
    user: { email, emailVerified: true },
  });

  afterEach(() => {
    if (originalAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = originalAdminEmails;
    }
  });

  it('allows a session whose email is in ADMIN_EMAILS', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com,otro@example.com';

    expect(guard.canActivate(contextFor(sessionOf('otro@example.com')))).toBe(
      true,
    );
  });

  it('ignores spaces and case in the list and in the session email', () => {
    process.env.ADMIN_EMAILS = ' Admin@Example.com , ,otro@example.com ';

    expect(guard.canActivate(contextFor(sessionOf('ADMIN@example.COM')))).toBe(
      true,
    );
  });

  it('denies with 403 when the email is not in the list', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com';

    expect(() =>
      guard.canActivate(contextFor(sessionOf('user@example.com'))),
    ).toThrow(ForbiddenException);
  });

  it.each([
    ['is not defined', undefined],
    ['is empty', ''],
    ['only has separators', ' , ,'],
  ])('denies everyone with 403 when ADMIN_EMAILS %s', (_label, value) => {
    if (value === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = value;

    expect(() =>
      guard.canActivate(contextFor(sessionOf('admin@example.com'))),
    ).toThrow(ForbiddenException);
  });

  it.each([
    ['false', { email: 'admin@example.com', emailVerified: false }],
    ['missing', { email: 'admin@example.com' }],
    [
      'a string instead of a boolean',
      { email: 'admin@example.com', emailVerified: 'true' },
    ],
  ])(
    'denies with 403 an admin email whose emailVerified is %s',
    (_label, user) => {
      process.env.ADMIN_EMAILS = 'admin@example.com';

      expect(() => guard.canActivate(contextFor({ user }))).toThrow(
        'Se requiere un usuario administrador para realizar esta acción',
      );
    },
  );

  it.each([
    ['there is no session', undefined],
    ['the session has no user', {}],
    ['the user has no email', { user: { emailVerified: true } }],
  ])('denies with 403 when %s', (_label, session) => {
    process.env.ADMIN_EMAILS = 'admin@example.com';

    expect(() => guard.canActivate(contextFor(session))).toThrow(
      'Se requiere un usuario administrador para realizar esta acción',
    );
  });
});
