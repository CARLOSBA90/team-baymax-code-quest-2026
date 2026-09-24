import { HttpException, HttpStatus } from '@nestjs/common';
import { RoadmapItemType } from '../../generated/prisma/enums.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { TrackProgressDto } from './dto/track-progress.dto.js';
import { ProgressService } from './progress.service.js';
import type { ChallengeFileStorageService } from './storage/challenge-file-storage.service.js';

const USER_ID = 'user-1';
const ROADMAP_ID = 'roadmap-1';
const ITEM_ID = 'item-1';

interface ItemOptions {
  type?: RoadmapItemType;
  contentData?: unknown;
  percentage?: number;
  trackingState?: unknown;
  pausedAt?: Date | null;
}

function buildItem(options: ItemOptions = {}) {
  return {
    id: ITEM_ID,
    roadmapId: ROADMAP_ID,
    type: options.type ?? RoadmapItemType.COURSE,
    contentData: options.contentData ?? {},
    progress: {
      roadmapItemId: ITEM_ID,
      percentage: options.percentage ?? 0,
      version: 0,
      trackingState: options.trackingState ?? {},
      startedAt: null,
      completedAt: null,
      updatedAt: new Date('2026-09-24T00:00:00.000Z'),
    },
    roadmap: {
      id: ROADMAP_ID,
      userId: USER_ID,
      pausedAt: options.pausedAt ?? null,
    },
  };
}

function setup(options: ItemOptions = {}) {
  const item = buildItem(options);
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    roadmapItem: {
      findFirst: vi.fn().mockResolvedValue({ roadmapId: ROADMAP_ID }),
      findUnique: vi.fn().mockResolvedValue(item),
    },
    progress: {
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([{ percentage: 50 }]),
    },
    roadmap: { update: vi.fn().mockResolvedValue({}) },
    challengeSubmission: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
  };
  const prisma = {
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
    roadmap: {
      findFirst: vi.fn().mockResolvedValue({
        id: ROADMAP_ID,
        pausedAt: null,
        lastActivityAt: new Date('2026-09-24T00:00:00.000Z'),
        activityVersion: 1,
        items: [item],
      }),
    },
    roadmapItem: {
      findFirst: vi.fn().mockResolvedValue({
        type: item.type,
        contentData: item.contentData,
      }),
    },
    challengeSubmission: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };
  const storage = {
    checksum: vi.fn().mockReturnValue('sum'),
    save: vi.fn().mockResolvedValue({ storageKey: 'key', checksum: 'sum' }),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  const service = new ProgressService(
    prisma as unknown as PrismaService,
    storage as unknown as ChallengeFileStorageService,
  );
  return { service, tx, prisma, storage };
}

async function expectError(
  promise: Promise<unknown>,
  status: number,
  code: string,
) {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(HttpException);
  expect((error as HttpException).getStatus()).toBe(status);
  expect((error as HttpException).getResponse()).toMatchObject({ code });
}

const report = (fields: Partial<TrackProgressDto>) =>
  ({ roadmap_item_id: ITEM_ID, ...fields }) as TrackProgressDto;

const video = {
  type: RoadmapItemType.MEDIA,
  contentData: { tracking: { type: 'VIDEO', durationSeconds: 600 } },
};

describe('ProgressService.track', () => {
  it('completes a course and records roadmap activity', async () => {
    const { service, tx } = setup();

    const result = await service.track(USER_ID, report({ completed: true }));

    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.progress.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          percentage: 100,
          version: { increment: 1 },
        }),
      }),
    );
    expect(tx.roadmap.update).toHaveBeenCalledTimes(1);
  });

  it('treats marking a completed item again as a no-op', async () => {
    const { service, tx } = setup({ percentage: 100 });

    const result = await service.track(USER_ID, report({ completed: true }));

    expect(result.statusCode).toBe(HttpStatus.OK);
    expect(tx.progress.update).not.toHaveBeenCalled();
    expect(tx.roadmap.update).not.toHaveBeenCalled();
  });

  it('rejects a field that does not match the item tracking', async () => {
    const { service, tx } = setup();

    await expectError(
      service.track(USER_ID, report({ position_seconds: 10 })),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'TRACKING_REPORT_MISMATCH',
    );
    expect(tx.progress.update).not.toHaveBeenCalled();
  });

  it('rejects a report that carries more than one field', async () => {
    const { service } = setup(video);

    await expectError(
      service.track(USER_ID, report({ completed: true, position_seconds: 10 })),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'TRACKING_REPORT_MISMATCH',
    );
  });

  it('rejects an empty report', async () => {
    const { service } = setup();

    await expectError(
      service.track(USER_ID, report({})),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'TRACKING_REPORT_MISMATCH',
    );
  });

  it('rejects reports while the roadmap is paused', async () => {
    const { service, tx } = setup({ pausedAt: new Date() });

    await expectError(
      service.track(USER_ID, report({ completed: true })),
      HttpStatus.CONFLICT,
      'ROADMAP_PAUSED',
    );
    expect(tx.progress.update).not.toHaveBeenCalled();
  });

  it('calculates video progress from the trusted duration', async () => {
    const { service, tx } = setup(video);

    await service.track(USER_ID, report({ position_seconds: 135 }));

    const data = tx.progress.update.mock.calls[0][0].data;
    expect(data.percentage).toBe(22.5);
    expect(data.trackingState).toMatchObject({
      lastPositionSeconds: 135,
      maxPositionSeconds: 135,
    });
  });

  it('ignores a repeated video position', async () => {
    const { service, tx } = setup({
      ...video,
      percentage: 22.5,
      trackingState: { lastPositionSeconds: 135, maxPositionSeconds: 135 },
    });

    await service.track(USER_ID, report({ position_seconds: 135 }));

    expect(tx.progress.update).not.toHaveBeenCalled();
  });

  it('refuses video reports without a trusted duration', async () => {
    const { service } = setup({
      type: RoadmapItemType.MEDIA,
      contentData: { tracking: { type: 'VIDEO' } },
    });

    await expectError(
      service.track(USER_ID, report({ position_seconds: 10 })),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'TRACKING_METADATA_MISSING',
    );
  });

  it('persists a challenge submission as pending review', async () => {
    const { service, tx } = setup({ type: RoadmapItemType.CHALLENGE });

    const result = await service.track(
      USER_ID,
      report({
        submission: { type: 'CODE', language: 'TypeScript', content: 'x' },
      } as Partial<TrackProgressDto>),
    );

    expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(tx.challengeSubmission.create).toHaveBeenCalledTimes(1);
    expect(tx.progress.update.mock.calls[0][0].data.percentage).toBe(0);
  });

  it('recognises a retried submission by its content', async () => {
    const { service, tx } = setup({ type: RoadmapItemType.CHALLENGE });
    tx.challengeSubmission.findFirst.mockResolvedValue({ id: 'existing' });

    const result = await service.track(
      USER_ID,
      report({
        submission: { type: 'TEXT', content: 'respuesta' },
      } as Partial<TrackProgressDto>),
    );

    expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(tx.challengeSubmission.create).not.toHaveBeenCalled();
    expect(tx.progress.update).not.toHaveBeenCalled();
  });

  it('rejects code in a language the challenge does not allow', async () => {
    const { service, tx } = setup({
      type: RoadmapItemType.CHALLENGE,
      contentData: { tracking: { allowedLanguages: ['python'] } },
    });

    await expectError(
      service.track(
        USER_ID,
        report({
          submission: { type: 'CODE', language: 'typescript', content: 'x' },
        } as Partial<TrackProgressDto>),
      ),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'SUBMISSION_NOT_ALLOWED',
    );
    expect(tx.challengeSubmission.create).not.toHaveBeenCalled();
  });

  it('rejects submission types the challenge does not accept', async () => {
    const { service } = setup({
      type: RoadmapItemType.CHALLENGE,
      contentData: { tracking: { acceptedSubmissionTypes: ['LINK'] } },
    });

    await expectError(
      service.track(
        USER_ID,
        report({
          submission: { type: 'TEXT', content: 'respuesta' },
        } as Partial<TrackProgressDto>),
      ),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'SUBMISSION_NOT_ALLOWED',
    );
  });
});

describe('ProgressService.track lessons', () => {
  const lessons = (trackingState: unknown = {}, percentage = 0) => ({
    percentage,
    trackingState,
    contentData: {
      tracking: { type: 'LESSONS' },
      syllabus: {
        sections: [
          { title: 'S1', lessons: [{ id: 'l1' }, { id: 'l2' }] },
          { title: 'S2', lessons: [{ id: 'l3' }, { id: 'l4' }] },
        ],
      },
    },
  });

  it('marks a lesson and derives the course percentage', async () => {
    const { service, tx } = setup(lessons());

    await service.track(USER_ID, report({ lesson_id: 'l3', completed: true }));

    const data = tx.progress.update.mock.calls[0][0].data;
    expect(data.percentage).toBe(25);
    expect(data.trackingState.completedLessons).toEqual(['l3']);
    expect(data.trackingState.lastLessonId).toBe('l3');
    expect(tx.roadmap.update).toHaveBeenCalledTimes(1);
  });

  it('completes the course when every lesson is marked', async () => {
    const { service, tx } = setup(
      lessons({ completedLessons: ['l1', 'l2', 'l3'] }, 75),
    );

    await service.track(USER_ID, report({ lesson_id: 'l4', completed: true }));

    const data = tx.progress.update.mock.calls[0][0].data;
    expect(data.percentage).toBe(100);
    expect(data.completedAt).toBeInstanceOf(Date);
  });

  it('unmarks a lesson and lowers the percentage', async () => {
    const { service, tx } = setup(
      lessons({ completedLessons: ['l1', 'l2', 'l3', 'l4'] }, 100),
    );

    await service.track(USER_ID, report({ lesson_id: 'l2', completed: false }));

    const data = tx.progress.update.mock.calls[0][0].data;
    expect(data.percentage).toBe(75);
    expect(data.completedAt).toBeNull();
    expect(data.trackingState.completedLessons).toEqual(['l1', 'l3', 'l4']);
  });

  it('treats repeating the last lesson report as a no-op', async () => {
    const { service, tx } = setup(
      lessons({ completedLessons: ['l1'], lastLessonId: 'l1' }, 25),
    );

    await service.track(USER_ID, report({ lesson_id: 'l1', completed: true }));

    expect(tx.progress.update).not.toHaveBeenCalled();
  });

  it('stores the playback second of a lesson to resume it', async () => {
    const { service, tx } = setup(lessons({ completedLessons: ['l1'] }, 25));

    await service.track(
      USER_ID,
      report({ lesson_id: 'l2', position_seconds: 312 }),
    );

    const data = tx.progress.update.mock.calls[0][0].data;
    expect(data.percentage).toBe(25);
    expect(data.trackingState).toMatchObject({
      lastLessonId: 'l2',
      lessonPositions: { l2: 312 },
      completedLessons: ['l1'],
    });
  });

  it('ignores a repeated playback second', async () => {
    const { service, tx } = setup(
      lessons({ lastLessonId: 'l2', lessonPositions: { l2: 312 } }),
    );

    await service.track(
      USER_ID,
      report({ lesson_id: 'l2', position_seconds: 312 }),
    );

    expect(tx.progress.update).not.toHaveBeenCalled();
  });

  it('rejects a playback report without its lesson', async () => {
    const { service } = setup(lessons());

    await expectError(
      service.track(USER_ID, report({ position_seconds: 10 })),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'TRACKING_REPORT_MISMATCH',
    );
  });

  it('rejects a lesson from another course', async () => {
    const { service } = setup(lessons());

    await expectError(
      service.track(USER_ID, report({ lesson_id: 'other', completed: true })),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'LESSON_NOT_IN_ITEM',
    );
  });

  it('requires the lesson id for lesson tracking', async () => {
    const { service } = setup(lessons());

    await expectError(
      service.track(USER_ID, report({ completed: true })),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'TRACKING_REPORT_MISMATCH',
    );
  });

  it('only accepts completed: true for items without lessons', async () => {
    const { service } = setup();

    await expectError(
      service.track(USER_ID, report({ completed: false })),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'TRACKING_REPORT_MISMATCH',
    );
  });
});

describe('ProgressService.track with a file', () => {
  const pdf = {
    buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
    originalname: 'entrega.pdf',
    mimetype: 'application/pdf',
    size: 4,
  };
  const fileReport = () =>
    report({ submission: { type: 'FILE' } } as Partial<TrackProgressDto>);

  it('stores the file and creates a pending submission in one request', async () => {
    const { service, storage, tx } = setup({
      type: RoadmapItemType.CHALLENGE,
    });

    const result = await service.track(USER_ID, fileReport(), pdf);

    expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(storage.save).toHaveBeenCalledWith(pdf.buffer, pdf.originalname);
    expect(tx.challengeSubmission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        submissionType: 'FILE',
        storageKey: 'key',
        originalFilename: 'entrega.pdf',
        checksum: 'sum',
      }),
    });
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('requires the file for a FILE submission', async () => {
    const { service } = setup({ type: RoadmapItemType.CHALLENGE });

    await expectError(
      service.track(USER_ID, fileReport()),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'SUBMISSION_NOT_ALLOWED',
    );
  });

  it('rejects a file attached to a non-file report', async () => {
    const { service, storage } = setup();

    await expectError(
      service.track(USER_ID, report({ completed: true }), pdf),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'SUBMISSION_NOT_ALLOWED',
    );
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rejects extensions outside the challenge policy before storing', async () => {
    const { service, storage } = setup({ type: RoadmapItemType.CHALLENGE });

    await expectError(
      service.track(USER_ID, fileReport(), {
        ...pdf,
        originalname: 'virus.exe',
      }),
      HttpStatus.UNPROCESSABLE_ENTITY,
      'FILE_EXTENSION_NOT_ALLOWED',
    );
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('returns 413 when the file exceeds the challenge limit', async () => {
    const { service } = setup({
      type: RoadmapItemType.CHALLENGE,
      contentData: { tracking: { maxFileSizeBytes: 2 } },
    });

    await expectError(
      service.track(USER_ID, fileReport(), pdf),
      HttpStatus.PAYLOAD_TOO_LARGE,
      'FILE_TOO_LARGE',
    );
  });

  it('removes the stored file when the report is rejected', async () => {
    const { service, storage } = setup({
      type: RoadmapItemType.CHALLENGE,
      pausedAt: new Date(),
    });

    await expectError(
      service.track(USER_ID, fileReport(), pdf),
      HttpStatus.CONFLICT,
      'ROADMAP_PAUSED',
    );
    expect(storage.remove).toHaveBeenCalledWith('key');
  });

  it('removes the duplicate file when the same submission is retried', async () => {
    const { service, storage, tx } = setup({ type: RoadmapItemType.CHALLENGE });
    tx.challengeSubmission.findFirst.mockResolvedValue({ id: 'existing' });

    const result = await service.track(USER_ID, fileReport(), pdf);

    expect(result.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(tx.challengeSubmission.create).not.toHaveBeenCalled();
    expect(storage.remove).toHaveBeenCalledWith('key');
  });
});
