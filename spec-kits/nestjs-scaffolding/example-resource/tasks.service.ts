/**
 * Tasks Service — Lógica de negocio del resource "tasks"
 *
 * Este service contiene toda la lógica de negocio.
 * Se comunica con la base de datos a través de PrismaService.
 *
 * Reglas:
 * - Toda la lógica va aquí, NO en el controller
 * - Lanzar excepciones de NestJS para errores (NotFoundException, etc.)
 * - Retornar datos transformados, no el raw de Prisma directamente
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una nueva tarea
   */
  async create(createTaskDto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priority ?? 'MEDIUM',
        status: 'PENDING',
      },
    });

    return {
      message: 'Tarea creada exitosamente',
      data: task,
    };
  }

  /**
   * Lista todas las tareas con paginación
   */
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count(),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene una tarea por ID
   * Lanza NotFoundException si no existe
   */
  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException(`Tarea con ID "${id}" no encontrada`);
    }

    return { data: task };
  }

  /**
   * Actualiza parcialmente una tarea
   */
  async update(id: string, updateTaskDto: UpdateTaskDto) {
    // Verificar que existe
    await this.findOne(id);

    const task = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });

    return {
      message: 'Tarea actualizada exitosamente',
      data: task,
    };
  }

  /**
   * Elimina una tarea
   */
  async remove(id: string) {
    // Verificar que existe
    await this.findOne(id);

    await this.prisma.task.delete({
      where: { id },
    });

    return { message: 'Tarea eliminada exitosamente' };
  }
}
