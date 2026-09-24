import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChallengeFileStorageService {
  private directory(): string {
    return resolve(
      process.env.CHALLENGE_UPLOAD_DIR ?? '.data/challenge-submissions',
    );
  }

  checksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  async save(buffer: Buffer, originalName: string) {
    const directory = this.directory();
    await mkdir(directory, { recursive: true });
    const key = `${randomUUID()}${extname(originalName).toLowerCase()}`;
    await writeFile(join(directory, key), buffer, { flag: 'wx' });
    return { storageKey: key, checksum: this.checksum(buffer) };
  }

  /** Removes a stored object whose submission was never persisted. */
  async remove(storageKey: string): Promise<void> {
    await rm(join(this.directory(), storageKey), { force: true });
  }
}
