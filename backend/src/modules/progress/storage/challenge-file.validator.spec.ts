import {
  ChallengeFileError,
  validateChallengeFile,
} from './challenge-file.validator.js';

const policy = {
  allowedFileExtensions: ['.pdf', '.txt'],
  maxFileSizeBytes: 10,
};

const file = (originalname: string, bytes: number[]) => ({
  buffer: Buffer.from(bytes),
  originalname,
  size: bytes.length,
});

describe('validateChallengeFile', () => {
  it('accepts a PDF with a valid signature', () => {
    expect(
      validateChallengeFile(
        file('entrega.PDF', [0x25, 0x50, 0x44, 0x46]),
        policy,
      ),
    ).toBeNull();
  });

  it('accepts text files without a binary signature', () => {
    expect(
      validateChallengeFile(file('notas.txt', [0x68, 0x69]), policy),
    ).toBeNull();
  });

  it('rejects empty files', () => {
    expect(validateChallengeFile(file('vacio.txt', []), policy)).toBe(
      ChallengeFileError.EMPTY,
    );
  });

  it('rejects files larger than the policy limit', () => {
    expect(
      validateChallengeFile(
        file(
          'grande.txt',
          Array.from({ length: 11 }, () => 0x61),
        ),
        policy,
      ),
    ).toBe(ChallengeFileError.TOO_LARGE);
  });

  it('rejects extensions outside the policy', () => {
    expect(
      validateChallengeFile(file('script.exe', [0x4d, 0x5a]), policy),
    ).toBe(ChallengeFileError.EXTENSION_NOT_ALLOWED);
  });

  it('rejects a renamed file whose content does not match the extension', () => {
    expect(
      validateChallengeFile(
        file('falso.pdf', [0x4d, 0x5a, 0x90, 0x00]),
        policy,
      ),
    ).toBe(ChallengeFileError.SIGNATURE_MISMATCH);
  });
});
