/**
 * Tasks Controller — Ejemplo completo de un resource CRUD
 *
 * Este controller maneja las rutas HTTP para el recurso "tasks".
 * Toda la lógica de negocio se delega al TasksService.
 *
 * Rutas:
 *   GET    /api/v1/tasks       → findAll()
 *   GET    /api/v1/tasks/:id   → findOne()
 *   POST   /api/v1/tasks       → create()
 *   PATCH  /api/v1/tasks/:id   → update()
 *   DELETE /api/v1/tasks/:id   → remove()
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * POST /tasks
   * Crea una nueva tarea
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva tarea' })
  @ApiResponse({ status: 201, description: 'Tarea creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  /**
   * GET /tasks
   * Lista todas las tareas con paginación
   */
  @Get()
  @ApiOperation({ summary: 'Listar todas las tareas' })
  @ApiResponse({ status: 200, description: 'Lista de tareas' })
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.tasksService.findAll(page, limit);
  }

  /**
   * GET /tasks/:id
   * Obtiene una tarea por su ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiResponse({ status: 200, description: 'Tarea encontrada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  /**
   * PATCH /tasks/:id
   * Actualiza parcialmente una tarea
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una tarea' })
  @ApiResponse({ status: 200, description: 'Tarea actualizada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  /**
   * DELETE /tasks/:id
   * Elimina una tarea
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiResponse({ status: 204, description: 'Tarea eliminada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
