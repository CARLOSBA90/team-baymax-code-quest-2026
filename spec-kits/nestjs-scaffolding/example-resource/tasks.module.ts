/**
 * Tasks Module — Módulo del resource "tasks"
 *
 * Registra el controller y service del módulo.
 * Se importa en AppModule.
 */

import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService], // Exportar si otros módulos necesitan el service
})
export class TasksModule {}
