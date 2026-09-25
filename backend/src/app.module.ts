import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AssessmentsModule } from './modules/assessments/assessments.module.js';
import { auth } from './modules/auth/auth.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { ProgressModule } from './modules/progress/progress.module.js';
import { RoadmapsModule } from './modules/roadmaps/roadmaps.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule.forRoot({ auth }),
    UsersModule,
    AssessmentsModule,
    CatalogModule,
    RoadmapsModule,
    ProgressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
