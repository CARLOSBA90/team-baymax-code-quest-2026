const mocks = vi.hoisted(() => ({
  auth: { $Infer: {} },
  betterAuth: vi.fn(),
  databaseAdapter: { type: 'prisma-adapter' },
  prisma: { type: 'shared-prisma-client' },
  prismaAdapter: vi.fn(),
}));

vi.mock('dotenv/config', () => ({}));
vi.mock('better-auth', () => ({
  betterAuth: mocks.betterAuth,
}));
vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: mocks.prismaAdapter,
}));
vi.mock('../../prisma/prisma.service.js', () => ({
  prisma: mocks.prisma,
}));

describe('auth configuration', () => {
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.betterAuth.mockReturnValue(mocks.auth);
    mocks.prismaAdapter.mockReturnValue(mocks.databaseAdapter);
    process.env.DISCORD_CLIENT_ID = 'discord-client';
    process.env.DISCORD_CLIENT_SECRET = 'discord-secret';
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it('normalizes configured trusted origins and reuses them in Better Auth', async () => {
    process.env.TRUSTED_ORIGINS =
      ' https://app.example.com, ,http://localhost:5173,https://admin.example.com ';

    const { auth, trustedOrigins } = await import('./auth.js');

    expect(trustedOrigins).toEqual([
      'https://app.example.com',
      'http://localhost:5173',
      'https://admin.example.com',
    ]);
    expect(auth).toBe(mocks.auth);
    expect(mocks.prismaAdapter).toHaveBeenCalledExactlyOnceWith(mocks.prisma, {
      provider: 'postgresql',
    });
    expect(mocks.betterAuth).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        database: mocks.databaseAdapter,
        trustedOrigins,
      }),
    );
  });

  it('uses an empty trusted-origin list when the variable is absent', async () => {
    delete process.env.TRUSTED_ORIGINS;

    const { trustedOrigins } = await import('./auth.js');

    expect(trustedOrigins).toEqual([]);
  });

  it('enables email login, Discord credentials, and the intended session limits', async () => {
    process.env.TRUSTED_ORIGINS = 'https://app.example.com';

    await import('./auth.js');

    expect(mocks.betterAuth).toHaveBeenCalledExactlyOnceWith({
      database: mocks.databaseAdapter,
      emailAndPassword: { enabled: true },
      socialProviders: {
        discord: {
          clientId: 'discord-client',
          clientSecret: 'discord-secret',
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
          enabled: true,
          maxAge: 60 * 5,
        },
      },
      trustedOrigins: ['https://app.example.com'],
    });
  });
});
