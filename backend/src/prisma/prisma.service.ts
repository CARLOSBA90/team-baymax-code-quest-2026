import 'dotenv/config';
import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

/**
 * Instancia única del cliente. Better Auth se configura fuera del contenedor
 * de Nest (src/auth/auth.ts), así que ambos comparten este mismo objeto para
 * no abrir dos pools de conexiones contra la base de datos.
 */
export const prisma = new PrismaService();
