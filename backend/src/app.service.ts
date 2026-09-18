import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /** Estado de la API con el formato de respuesta del contrato. */
  getHealth() {
    return { data: { status: 'ok' } };
  }
}
