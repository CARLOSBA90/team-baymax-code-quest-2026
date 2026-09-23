import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChallengeFileStorageService {
  async save(buffer: Buffer, originalName: string) {
    const directory = resolve(
      process.env.CHALLENGE_UPLOAD_DIR ?? '.data/challenge-submissions',
    );
    await mkdir(directory, { recursive: true });
    const key = `${randomUUID()}${extname(originalName).toLowerCase()}`;
    await writeFile(join(directory, key), buffer, { flag: 'wx' });
    return {
      storageKey: key,
      checksum: createHash('sha256').update(buffer).digest('hex'),
    };
  }
}
