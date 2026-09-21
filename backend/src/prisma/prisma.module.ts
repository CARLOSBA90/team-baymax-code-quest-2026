import { Global, Module } from '@nestjs/common';
import { prisma, PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: prisma }],
  exports: [PrismaService],
})
export class PrismaModule {}
