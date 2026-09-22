import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';

interface RequestWithSession {
  session?: { user?: { email?: string } } | null;
}

/**
 * Permite el acceso solo si el email de la sesión está en ADMIN_EMAILS
 * (lista separada por comas). Sin la variable, deniega a todos con 403.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const email = request.session?.user?.email?.trim().toLowerCase();

    if (!email || !this.adminEmails().has(email)) {
      throw new ForbiddenException(
        'Se requiere un usuario administrador para realizar esta acción',
      );
    }

    return true;
  }

  /** Lee ADMIN_EMAILS en cada request para no depender del orden de carga. */
  private adminEmails(): Set<string> {
    return new Set(
      (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );
  }
}
