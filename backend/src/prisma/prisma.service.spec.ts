const mocks = vi.hoisted(() => ({
  adapter: { type: 'postgres-adapter' },
  clientConstructor: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  prismaPg: vi.fn(),
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {
    constructor(options: unknown) {
      mocks.prismaPg(options);
      return mocks.adapter;
    }
  },
}));
vi.mock('../generated/prisma/client.js', () => ({
  PrismaClient: class {
    $connect = mocks.connect;
    $disconnect = mocks.disconnect;

    constructor(options: unknown) {
      mocks.clientConstructor(options);
    }
  },
}));

describe('PrismaService', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'postgresql://user:password@db.example.com/app';
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it('builds the shared Prisma client with DATABASE_URL and PrismaPg', async () => {
    const { prisma, PrismaService } = await import('./prisma.service.js');

    expect(prisma).toBeInstanceOf(PrismaService);
    expect(mocks.prismaPg).toHaveBeenCalledExactlyOnceWith({
      connectionString: 'postgresql://user:password@db.example.com/app',
    });
    expect(mocks.clientConstructor).toHaveBeenCalledExactlyOnceWith({
      adapter: mocks.adapter,
    });
  });

  it('connects when its Nest module initializes', async () => {
    const { prisma } = await import('./prisma.service.js');

    await prisma.onModuleInit();

    expect(mocks.connect).toHaveBeenCalledOnce();
  });

  it('disconnects when its Nest module is destroyed', async () => {
    const { prisma } = await import('./prisma.service.js');

    await prisma.onModuleDestroy();

    expect(mocks.disconnect).toHaveBeenCalledOnce();
  });
});
