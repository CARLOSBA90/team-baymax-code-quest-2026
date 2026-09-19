const mocks = vi.hoisted(() => ({
  app: {
    enableCors: vi.fn(),
    listen: vi.fn().mockResolvedValue(undefined),
    setGlobalPrefix: vi.fn(),
  },
  AppModule: class AppModule {},
  create: vi.fn(),
  trustedOrigins: ['https://app.example.com'],
}));

vi.mock('@nestjs/core', () => ({
  NestFactory: { create: mocks.create },
}));
vi.mock('./app.module.js', () => ({
  AppModule: mocks.AppModule,
}));
vi.mock('./modules/auth/auth.js', () => ({
  trustedOrigins: mocks.trustedOrigins,
}));

describe('bootstrap', () => {
  const originalPort = process.env.PORT;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.create.mockResolvedValue(mocks.app);
  });

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  });

  it('configures raw-body auth compatibility, CORS, prefix, and PORT', async () => {
    process.env.PORT = '4310';

    await import('./main.js');

    expect(mocks.create).toHaveBeenCalledExactlyOnceWith(mocks.AppModule, {
      bodyParser: false,
    });
    expect(mocks.app.enableCors).toHaveBeenCalledExactlyOnceWith({
      origin: mocks.trustedOrigins,
      credentials: true,
    });
    expect(mocks.app.setGlobalPrefix).toHaveBeenCalledExactlyOnceWith('api/v1');
    expect(mocks.app.listen).toHaveBeenCalledExactlyOnceWith('4310');
  });

  it('listens on port 3000 when PORT is absent', async () => {
    delete process.env.PORT;

    await import('./main.js');

    expect(mocks.app.listen).toHaveBeenCalledExactlyOnceWith(3000);
  });
});
