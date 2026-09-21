import { describe, expect, it, vi } from 'vitest';
import { APIError } from 'better-auth/api';
import { AuthValidator } from './auth.validator.js';

describe('AuthValidator', () => {
  describe('validateSignUpPayload', () => {
    it('throws when body is not an object or is null/undefined', () => {
      expect(() => AuthValidator.validateSignUpPayload(null)).toThrow(APIError);
      expect(() => AuthValidator.validateSignUpPayload(undefined)).toThrow(
        APIError,
      );
      expect(() => AuthValidator.validateSignUpPayload('string')).toThrow(
        APIError,
      );
    });

    describe('name validation', () => {
      it('throws when name is missing or not a string', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            email: 'test@example.com',
            password: 'password123',
          }),
        ).toThrow('El nombre es obligatorio');

        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 123,
            email: 'test@example.com',
            password: 'password123',
          }),
        ).toThrow('El nombre es obligatorio');
      });

      it('throws when name is empty or only whitespace', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: '',
            email: 'test@example.com',
            password: 'password123',
          }),
        ).toThrow('El nombre es obligatorio');

        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: '   ',
            email: 'test@example.com',
            password: 'password123',
          }),
        ).toThrow('El nombre es obligatorio');
      });

      it('throws when name is shorter than 2 characters', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'A',
            email: 'test@example.com',
            password: 'password123',
          }),
        ).toThrow('El nombre debe tener al menos 2 caracteres');
      });

      it('throws when name exceeds 100 characters', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'A'.repeat(101),
            email: 'test@example.com',
            password: 'password123',
          }),
        ).toThrow('El nombre no puede exceder los 100 caracteres');
      });

      it('trims whitespace from name', () => {
        const result = AuthValidator.validateSignUpPayload({
          name: '  Carlos Peña  ',
          email: 'test@example.com',
          password: 'password123',
        });
        expect(result.name).toBe('Carlos Peña');
      });
    });

    describe('email validation', () => {
      it('throws when email is missing or not a string', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            password: 'password123',
          }),
        ).toThrow('El correo electrónico es obligatorio');

        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            email: 12345,
            password: 'password123',
          }),
        ).toThrow('El correo electrónico es obligatorio');
      });

      it('throws when email is empty or only whitespace', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            email: '   ',
            password: 'password123',
          }),
        ).toThrow('El correo electrónico es obligatorio');
      });

      it.each([
        'invalid',
        'invalid@',
        '@domain.com',
        'user@domain',
        'user@domain.',
        'user name@domain.com',
        'user@.domain.com',
      ])('throws when email format is invalid: "%s"', (invalidEmail) => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            email: invalidEmail,
            password: 'password123',
          }),
        ).toThrow('El formato del correo electrónico no es válido');
      });

      it('throws when email exceeds 255 characters', () => {
        const longEmail = `${'a'.repeat(250)}@example.com`;
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            email: longEmail,
            password: 'password123',
          }),
        ).toThrow('El formato del correo electrónico no es válido');
      });

      it('normalizes email to lowercase and trims whitespace', () => {
        const result = AuthValidator.validateSignUpPayload({
          name: 'Test User',
          email: '  User.Test@EXAMPLE.Com  ',
          password: 'password123',
        });
        expect(result.email).toBe('user.test@example.com');
      });
    });

    describe('password validation', () => {
      it('throws when password is missing or not a string', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            email: 'test@example.com',
          }),
        ).toThrow('La contraseña es obligatoria');

        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            email: 'test@example.com',
            password: 123456,
          }),
        ).toThrow('La contraseña es obligatoria');
      });

      it('throws when password is empty', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            email: 'test@example.com',
            password: '',
          }),
        ).toThrow('La contraseña es obligatoria');
      });

      it('throws when password has less than 6 characters', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            email: 'test@example.com',
            password: '12345',
          }),
        ).toThrow('La contraseña debe tener al menos 6 caracteres');
      });

      it('throws when password exceeds 128 characters', () => {
        expect(() =>
          AuthValidator.validateSignUpPayload({
            name: 'Test User',
            email: 'test@example.com',
            password: 'a'.repeat(129),
          }),
        ).toThrow('La contraseña no puede exceder los 128 caracteres');
      });

      it('accepts a valid password of 6 characters or more', () => {
        const result = AuthValidator.validateSignUpPayload({
          name: 'Test User',
          email: 'test@example.com',
          password: 'secretPassword123!',
        });
        expect(result.password).toBe('secretPassword123!');
      });
    });

    it('returns normalized data on valid payload', () => {
      const result = AuthValidator.validateSignUpPayload({
        name: '   Juan Pérez   ',
        email: '  JUAN.perez@Domain.CO  ',
        password: 'SecurePassword123',
      });

      expect(result).toEqual({
        name: 'Juan Pérez',
        email: 'juan.perez@domain.co',
        password: 'SecurePassword123',
      });
    });
  });

  describe('assertEmailNotRegistered', () => {
    it('resolves cleanly when userLookup is undefined', async () => {
      await expect(
        AuthValidator.assertEmailNotRegistered('test@example.com'),
      ).resolves.toBeUndefined();
    });

    it('resolves cleanly when user does not exist in DB', async () => {
      const mockLookup = {
        findUnique: vi.fn().mockResolvedValue(null),
      };

      await expect(
        AuthValidator.assertEmailNotRegistered('test@example.com', mockLookup),
      ).resolves.toBeUndefined();

      expect(mockLookup.findUnique).toHaveBeenCalledExactlyOnceWith({
        where: { email: 'test@example.com' },
      });
    });

    it('throws APIError 400 when email already exists via findUnique', async () => {
      const mockLookup = {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
      };

      let caughtError: unknown;
      try {
        await AuthValidator.assertEmailNotRegistered(
          'test@example.com',
          mockLookup,
        );
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(APIError);
      const apiError = caughtError as APIError;
      expect(apiError.status).toBe('BAD_REQUEST');
      expect(apiError.message).toBe('El correo electrónico ya está registrado');
    });

    it('throws APIError 400 when email exists via findFirst (case-insensitive check)', async () => {
      const mockLookup = {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: 'user-1', email: 'Test@example.com' }),
      };

      await expect(
        AuthValidator.assertEmailNotRegistered('test@example.com', mockLookup),
      ).rejects.toThrow('El correo electrónico ya está registrado');

      expect(mockLookup.findFirst).toHaveBeenCalledExactlyOnceWith({
        where: {
          email: {
            equals: 'test@example.com',
            mode: 'insensitive',
          },
        },
      });
    });
  });
});
