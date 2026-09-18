import 'dotenv/config';
import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/** Cliente de Prisma conectado a PostgreSQL mediante el adaptador PrismaPg. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /** Crea el cliente con la conexión de DATABASE_URL. */
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  /** Inicializa el adaptador; la conexión se abre en la primera consulta. */
  async onModuleInit() {
    await this.$connect();
  }

  /** Libera el pool cuando Nest cierra la aplicación con app.close(). */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// Instancia única compartida por Nest y Better Auth para no abrir dos pools.
export const prisma = new PrismaService();
