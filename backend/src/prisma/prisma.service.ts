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

  /** Conecta al arrancar para detectar pronto si la base no responde. */
  async onModuleInit() {
    await this.$connect();
  }

  /** Cierra las conexiones cuando la app se detiene. */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// Instancia única compartida por Nest y Better Auth para no abrir dos pools.
export const prisma = new PrismaService();
