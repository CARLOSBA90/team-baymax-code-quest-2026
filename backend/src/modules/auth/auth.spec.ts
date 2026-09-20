const mocks = vi.hoisted(() => ({
  auth: { $Infer: {} },
  betterAuth: vi.fn(),
  createAuthMiddleware: vi.fn((handler: unknown) => handler),
  databaseAdapter: { type: 'prisma-adapter' },
  logLog: vi.fn(),
  logWarn: vi.fn(),
  prisma: { type: 'shared-prisma-client' },
  prismaAdapter: vi.fn(),
}));

vi.mock('dotenv/config', () => ({}));
vi.mock('@nestjs/common', () => ({
  Logger: class {
    log = mocks.logLog;
    warn = mocks.logWarn;
  },
}));
vi.mock('better-auth', () => ({
  betterAuth: mocks.betterAuth,
}));
vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: mocks.prismaAdapter,
}));
vi.mock('better-auth/api', () => ({
  createAuthMiddleware: mocks.createAuthMiddleware,
}));
vi.mock('../../prisma/prisma.service.js', () => ({
  prisma: mocks.prisma,
}));

type Config = {
  database: unknown;
  emailAndPassword: {
    enabled: boolean;
    minPasswordLength: number;
    requireEmailVerification: boolean;
  };
  emailVerification: {
    sendOnSignUp: boolean;
    sendOnSignIn?: boolean;
    autoSignInAfterVerification: boolean;
    sendVerificationEmail: (data: {
      user: { email: string };
      url: string;
    }) => Promise<void>;
  };
  socialProviders: Record<string, { clientId: string; clientSecret: string }>;
  hooks: {
    after: (ctx: {
      path: string;
      body?: unknown;
      setHeader: (name: string, value: string) => void;
    }) => Promise<void>;
  };
  trustedOrigins: string[];
};

const ENV_KEYS = [
  'TRUSTED_ORIGINS',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'EXPOSE_VERIFICATION_URL',
  'NODE_ENV',
];

describe('auth configuration', () => {
  const originalEnvironment = { ...process.env };

  const load = async () => {
    const module = await import('./auth.js');
    const config = mocks.betterAuth.mock.calls[0][0] as Config;
    return { module, config };
  };

  const setAllProviders = () => {
    process.env.GOOGLE_CLIENT_ID = 'g-id';
    process.env.GOOGLE_CLIENT_SECRET = 'g-secret';
    process.env.GITHUB_CLIENT_ID = 'gh-id';
    process.env.GITHUB_CLIENT_SECRET = 'gh-secret';
    process.env.DISCORD_CLIENT_ID = 'd-id';
    process.env.DISCORD_CLIENT_SECRET = 'd-secret';
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    for (const key of ENV_KEYS) delete process.env[key];
    mocks.betterAuth.mockReturnValue(mocks.auth);
    mocks.prismaAdapter.mockReturnValue(mocks.databaseAdapter);
    mocks.createAuthMiddleware.mockImplementation(
      (handler: unknown) => handler,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnvironment };
  });

  describe('base configuration', () => {
    it('normalizes trusted origins and reuses them in Better Auth', async () => {
      process.env.TRUSTED_ORIGINS =
        ' https://app.example.com, ,http://localhost:5173 ';

      const { module, config } = await load();

      expect(module.trustedOrigins).toEqual([
        'https://app.example.com',
        'http://localhost:5173',
      ]);
      expect(module.auth).toBe(mocks.auth);
      expect(mocks.prismaAdapter).toHaveBeenCalledExactlyOnceWith(
        mocks.prisma,
        { provider: 'postgresql' },
      );
      expect(config.database).toBe(mocks.databaseAdapter);
      expect(config.trustedOrigins).toBe(module.trustedOrigins);
    });

    it('uses an empty trusted-origin list when the variable is absent', async () => {
      const { module } = await load();

      expect(module.trustedOrigins).toEqual([]);
    });

    it('configures email/password with min length 6 and required verification', async () => {
      const { config } = await load();

      expect(config.emailAndPassword).toEqual({
        enabled: true,
        minPasswordLength: 6,
        requireEmailVerification: true,
      });
    });

    it('configures email verification on sign-up without sendOnSignIn', async () => {
      const { config } = await load();

      expect(config.emailVerification.sendOnSignUp).toBe(true);
      expect(config.emailVerification.autoSignInAfterVerification).toBe(true);
      expect(config.emailVerification.sendOnSignIn).toBeUndefined();
    });
  });

  describe('social providers', () => {
    it('registers no provider when nothing is configured', async () => {
      const { config } = await load();

      expect(config.socialProviders).toEqual({});
      expect(mocks.logWarn).toHaveBeenCalledTimes(3);
    });

    it('registers only the providers with credentials', async () => {
      process.env.GITHUB_CLIENT_ID = 'gh-id';
      process.env.GITHUB_CLIENT_SECRET = 'gh-secret';

      const { config } = await load();

      expect(config.socialProviders).toEqual({
        github: { clientId: 'gh-id', clientSecret: 'gh-secret' },
      });
    });

    it('registers google, github and discord when all are configured', async () => {
      setAllProviders();

      const { config } = await load();

      expect(config.socialProviders).toEqual({
        google: { clientId: 'g-id', clientSecret: 'g-secret' },
        github: { clientId: 'gh-id', clientSecret: 'gh-secret' },
        discord: { clientId: 'd-id', clientSecret: 'd-secret' },
      });
      expect(mocks.logWarn).not.toHaveBeenCalled();
    });

    it('warns and omits a provider whose secret is missing', async () => {
      setAllProviders();
      delete process.env.GOOGLE_CLIENT_SECRET;

      const { config } = await load();

      expect(config.socialProviders).not.toHaveProperty('google');
      expect(config.socialProviders).toHaveProperty('github');
      expect(mocks.logWarn).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('GOOGLE_CLIENT_SECRET'),
      );
    });

    it('never passes undefined credentials to Better Auth', async () => {
      process.env.GOOGLE_CLIENT_ID = 'g-id';
      process.env.DISCORD_CLIENT_SECRET = 'd-secret';

      const { config } = await load();

      expect(config.socialProviders).toEqual({});
      for (const provider of Object.values(config.socialProviders)) {
        expect(provider.clientId).toBeDefined();
        expect(provider.clientSecret).toBeDefined();
      }
    });
  });

  describe('verification URL logging', () => {
    it('logs the URL when NODE_ENV is not production', async () => {
      process.env.NODE_ENV = 'development';
      const { config } = await load();

      await config.emailVerification.sendVerificationEmail({
        user: { email: 'a@b.com' },
        url: 'http://verify/1',
      });

      expect(mocks.logLog).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('http://verify/1'),
      );
    });

    it('does not log the URL in production', async () => {
      process.env.NODE_ENV = 'production';
      const { config } = await load();

      await config.emailVerification.sendVerificationEmail({
        user: { email: 'a@b.com' },
        url: 'http://verify/1',
      });

      expect(mocks.logLog).not.toHaveBeenCalled();
    });
  });

  describe('X-Verification-Url header hook', () => {
    const signUp = async (
      config: Config,
      email: string,
      path = '/sign-up/email',
      body: unknown = { email },
    ) => {
      const setHeader = vi.fn();
      await config.hooks.after({ path, body, setHeader });
      return setHeader;
    };

    const send = (config: Config, email: string, url = 'http://verify/1') =>
      config.emailVerification.sendVerificationEmail({
        user: { email },
        url,
      });

    beforeEach(() => {
      process.env.EXPOSE_VERIFICATION_URL = 'true';
      process.env.NODE_ENV = 'development';
    });

    it('sets the header on sign-up when the gate is on', async () => {
      const { config } = await load();
      await send(config, 'a@b.com');

      const setHeader = await signUp(config, 'a@b.com');

      expect(setHeader).toHaveBeenCalledExactlyOnceWith(
        'X-Verification-Url',
        'http://verify/1',
      );
    });

    it('does not set the header for other paths', async () => {
      const { config } = await load();
      await send(config, 'a@b.com');

      const setHeader = await signUp(config, 'a@b.com', '/sign-in/email');

      expect(setHeader).not.toHaveBeenCalled();
    });

    it('does not set the header when the body has no email string', async () => {
      const { config } = await load();
      await send(config, 'a@b.com');

      const setHeader = await signUp(config, 'a@b.com', '/sign-up/email', {
        email: 1,
      });

      expect(setHeader).not.toHaveBeenCalled();
    });

    it('does not store or expose the URL when the flag is off', async () => {
      process.env.EXPOSE_VERIFICATION_URL = 'false';
      const { config } = await load();
      await send(config, 'a@b.com');

      const setHeader = await signUp(config, 'a@b.com');

      expect(setHeader).not.toHaveBeenCalled();
    });

    it('does not expose the URL in production even with the flag on', async () => {
      process.env.NODE_ENV = 'production';
      const { config } = await load();
      await send(config, 'a@b.com');

      const setHeader = await signUp(config, 'a@b.com');

      expect(setHeader).not.toHaveBeenCalled();
    });

    it('does not set the header for an unknown email', async () => {
      const { config } = await load();
      await send(config, 'a@b.com');

      const setHeader = await signUp(config, 'other@b.com');

      expect(setHeader).not.toHaveBeenCalled();
    });

    it('does not set the header for a duplicate sign-up (entry already consumed)', async () => {
      const { config } = await load();
      await send(config, 'a@b.com');
      await signUp(config, 'a@b.com');

      const setHeader = await signUp(config, 'a@b.com');

      expect(setHeader).not.toHaveBeenCalled();
    });

    it('does not set the header once the entry has expired', async () => {
      vi.useFakeTimers();
      const { config } = await load();
      await send(config, 'a@b.com');

      vi.advanceTimersByTime(60_001);
      const setHeader = await signUp(config, 'a@b.com');

      expect(setHeader).not.toHaveBeenCalled();
    });

    it('still serves the entry just before it expires', async () => {
      vi.useFakeTimers();
      const { config } = await load();
      await send(config, 'a@b.com');

      vi.advanceTimersByTime(59_000);
      const setHeader = await signUp(config, 'a@b.com');

      expect(setHeader).toHaveBeenCalledOnce();
    });

    it('matches emails case-insensitively', async () => {
      const { config } = await load();
      await send(config, 'User@Example.COM');

      const setHeader = await signUp(config, 'user@example.com');

      expect(setHeader).toHaveBeenCalledExactlyOnceWith(
        'X-Verification-Url',
        'http://verify/1',
      );
    });

    it('deletes the entry after reading it', async () => {
      const { module } = await load();
      module.storeVerificationUrl('a@b.com', 'http://verify/1');

      expect(module.takeVerificationUrl('a@b.com')).toBe('http://verify/1');
      expect(module.takeVerificationUrl('a@b.com')).toBeUndefined();
    });
  });

  describe('isVerificationUrlExposed', () => {
    it.each([
      ['true', 'development', true],
      ['true', undefined, true],
      ['true', 'production', false],
      ['false', 'development', false],
      [undefined, 'development', false],
    ])('EXPOSE=%s NODE_ENV=%s -> %s', async (flag, nodeEnv, expected) => {
      if (flag !== undefined) process.env.EXPOSE_VERIFICATION_URL = flag;
      if (nodeEnv !== undefined) process.env.NODE_ENV = nodeEnv;

      const { module } = await load();

      expect(module.isVerificationUrlExposed()).toBe(expected);
    });
  });
});
