import { APIError } from 'better-auth/api';

export interface SignUpPayload {
  email?: unknown;
  password?: unknown;
  name?: unknown;
}

export interface ValidatedSignUpData {
  email: string;
  name: string;
  password: string;
}

export interface UserLookupAdapter {
  findUnique?: (args: { where: { email: string } }) => Promise<unknown>;
  findFirst?: (args: {
    where: {
      email: { equals: string; mode?: 'insensitive' } | string;
    };
  }) => Promise<unknown>;
}

export class AuthValidator {
  /**
   * Regex estándar para validación básica de formato de correo electrónico.
   * Valida estructura nombre@dominio.extensión (al menos 2 caracteres en el TLD).
   */
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

  /**
   * Valida los campos básicos requeridos para el registro con email y contraseña:
   * - name: requerido, string, no vacío tras trim, longitud entre 2 y 100 caracteres.
   * - email: requerido, string, no vacío tras trim, formato válido RFC, máx 255 caracteres.
   * - password: requerido, string, mínimo 6 caracteres, máx 128 caracteres.
   *
   * Retorna los datos normalizados (email en minúsculas y recortado, name recortado).
   */
  static validateSignUpPayload(body: unknown): ValidatedSignUpData {
    if (!body || typeof body !== 'object') {
      throw new APIError('BAD_REQUEST', {
        message: 'El cuerpo de la solicitud es inválido',
        code: 'INVALID_BODY',
      });
    }

    const { email, name, password } = body as SignUpPayload;

    // 1. Validación de nombre
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new APIError('BAD_REQUEST', {
        message: 'El nombre es obligatorio',
        code: 'NAME_REQUIRED',
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      throw new APIError('BAD_REQUEST', {
        message: 'El nombre debe tener al menos 2 caracteres',
        code: 'NAME_TOO_SHORT',
      });
    }

    if (trimmedName.length > 100) {
      throw new APIError('BAD_REQUEST', {
        message: 'El nombre no puede exceder los 100 caracteres',
        code: 'NAME_TOO_LONG',
      });
    }

    // 2. Validación de email
    if (typeof email !== 'string' || email.trim().length === 0) {
      throw new APIError('BAD_REQUEST', {
        message: 'El correo electrónico es obligatorio',
        code: 'EMAIL_REQUIRED',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (
      normalizedEmail.length > 255 ||
      !this.EMAIL_REGEX.test(normalizedEmail)
    ) {
      throw new APIError('BAD_REQUEST', {
        message: 'El formato del correo electrónico no es válido',
        code: 'INVALID_EMAIL_FORMAT',
      });
    }

    // 3. Validación de contraseña
    if (typeof password !== 'string' || password.length === 0) {
      throw new APIError('BAD_REQUEST', {
        message: 'La contraseña es obligatoria',
        code: 'PASSWORD_REQUIRED',
      });
    }

    if (password.length < 6) {
      throw new APIError('BAD_REQUEST', {
        message: 'La contraseña debe tener al menos 6 caracteres',
        code: 'PASSWORD_TOO_SHORT',
      });
    }

    if (password.length > 128) {
      throw new APIError('BAD_REQUEST', {
        message: 'La contraseña no puede exceder los 128 caracteres',
        code: 'PASSWORD_TOO_LONG',
      });
    }

    return {
      name: trimmedName,
      email: normalizedEmail,
      password,
    };
  }

  /**
   * Verifica si el correo ya existe en la base de datos para prevenir duplicados.
   * Si ya existe un usuario con ese correo (búsqueda exacta o case-insensitive),
   * lanza una excepción APIError 400 (BAD_REQUEST).
   */
  static async assertEmailNotRegistered(
    email: string,
    userLookup?: UserLookupAdapter,
  ): Promise<void> {
    if (!userLookup) return;

    let existingUser: unknown = null;

    if (userLookup.findUnique) {
      existingUser = await userLookup.findUnique({
        where: { email },
      });
    }

    if (!existingUser && userLookup.findFirst) {
      existingUser = await userLookup.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      });
    }

    if (existingUser) {
      throw new APIError('BAD_REQUEST', {
        message: 'El correo electrónico ya está registrado',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }
  }
}
