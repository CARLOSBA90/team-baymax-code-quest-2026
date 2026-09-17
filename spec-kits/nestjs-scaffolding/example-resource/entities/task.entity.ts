/**
 * Task Entity — Definición de la entidad Task
 *
 * La entity define la forma de los datos que salen del sistema
 * (la respuesta de la API). No confundir con el model de Prisma.
 *
 * Sirve para:
 * - Documentar la estructura de respuesta en Swagger
 * - Tipar las respuestas del service
 * - Excluir campos sensibles (como passwords) de las respuestas
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskEntity {
  @ApiProperty({
    description: 'ID único de la tarea',
    example: 'clx1abc2d0000abcdef123456',
  })
  id: string;

  @ApiProperty({
    description: 'Título de la tarea',
    example: 'Implementar login con Better Auth',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada',
    example: 'Configurar Better Auth en auth-api siguiendo el spec-kit',
  })
  description?: string;

  @ApiProperty({
    description: 'Estado actual de la tarea',
    example: 'PENDING',
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({
    description: 'Prioridad de la tarea',
    example: 'MEDIUM',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  })
  priority: string;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2026-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2026-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

/**
 * Modelo Prisma correspondiente (para referencia):
 *
 * model Task {
 *   id          String   @id @default(cuid())
 *   title       String
 *   description String?
 *   status      String   @default("PENDING")
 *   priority    String   @default("MEDIUM")
 *   createdAt   DateTime @default(now())
 *   updatedAt   DateTime @updatedAt
 * }
 */
