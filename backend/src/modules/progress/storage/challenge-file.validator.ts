import { extname } from 'node:path';
import type { TrackingPolicy } from '../tracking/tracking-policy.resolver.js';

export interface ChallengeUpload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export enum ChallengeFileError {
  EMPTY = 'FILE_EMPTY',
  TOO_LARGE = 'FILE_TOO_LARGE',
  EXTENSION_NOT_ALLOWED = 'FILE_EXTENSION_NOT_ALLOWED',
  SIGNATURE_MISMATCH = 'FILE_SIGNATURE_MISMATCH',
}

const SIGNATURES: Record<string, number[]> = {
  '.pdf': [0x25, 0x50, 0x44, 0x46],
  '.zip': [0x50, 0x4b, 0x03, 0x04],
  '.png': [0x89, 0x50, 0x4e, 0x47],
  '.jpg': [0xff, 0xd8, 0xff],
  '.jpeg': [0xff, 0xd8, 0xff],
};

export function validateChallengeFile(
  file: { buffer: Buffer; originalname: string; size: number },
  policy: Pick<TrackingPolicy, 'allowedFileExtensions' | 'maxFileSizeBytes'>,
): ChallengeFileError | null {
  if (file.size === 0 || file.buffer.length === 0)
    return ChallengeFileError.EMPTY;
  if (policy.maxFileSizeBytes !== null && file.size > policy.maxFileSizeBytes)
    return ChallengeFileError.TOO_LARGE;
  const extension = extname(file.originalname).toLowerCase();
  if (!policy.allowedFileExtensions.includes(extension))
    return ChallengeFileError.EXTENSION_NOT_ALLOWED;
  const signature = SIGNATURES[extension];
  if (
    signature &&
    !signature.every((byte, index) => file.buffer[index] === byte)
  )
    return ChallengeFileError.SIGNATURE_MISMATCH;
  return null;
}
