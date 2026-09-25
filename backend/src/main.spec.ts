import { ValidationPipe } from '@nestjs/common';

const mocks = vi.hoisted(() => ({
  app: {
    enableCors: vi.fn(),
    listen: vi.fn().mockResolvedValue(undefined),
    setGlobalPrefix: vi.fn(),
    useGlobalPipes: vi.fn(),
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
      exposedHeaders: ['X-Verification-Url'],
    });
    expect(mocks.app.setGlobalPrefix).toHaveBeenCalledExactlyOnceWith('api/v1');
    expect(mocks.app.listen).toHaveBeenCalledExactlyOnceWith('4310');
  });

  it('registers a global ValidationPipe with whitelist and transform', async () => {
    await import('./main.js');

    expect(mocks.app.useGlobalPipes).toHaveBeenCalledExactlyOnceWith(
      expect.any(ValidationPipe),
    );
    const [pipe] = mocks.app.useGlobalPipes.mock.calls[0];
    expect(pipe).toMatchObject({
      isTransformEnabled: true,
      validatorOptions: { whitelist: true, forbidNonWhitelisted: true },
    });
  });

  it('listens on port 3001 when PORT is absent', async () => {
    delete process.env.PORT;

    await import('./main.js');

    expect(mocks.app.listen).toHaveBeenCalledExactlyOnceWith(3001);
  });
});
