import { RoadmapItemType } from '../../../generated/prisma/enums.js';
import {
  DEFAULT_CHALLENGE_FILE_EXTENSIONS,
  DEFAULT_CHALLENGE_LANGUAGES,
  MAX_CHALLENGE_FILE_BYTES,
  SubmissionType,
  TrackingType,
  VIDEO_REPORT_INTERVAL_SECONDS,
} from '../progress.constants.js';
import {
  resolveTrackingPolicy,
  serializeTrackingPolicy,
} from './tracking-policy.resolver.js';

describe('resolveTrackingPolicy', () => {
  it('tracks historical courses by completion', () => {
    expect(resolveTrackingPolicy(RoadmapItemType.COURSE, {}).type).toBe(
      TrackingType.COMPLETION,
    );
  });

  it('maps the legacy MANUAL type to COMPLETION', () => {
    expect(
      resolveTrackingPolicy(RoadmapItemType.COURSE, {
        tracking: { type: 'MANUAL' },
      }).type,
    ).toBe(TrackingType.COMPLETION);
  });

  it('tracks a course with a syllabus by its lessons', () => {
    const policy = resolveTrackingPolicy(RoadmapItemType.COURSE, {
      tracking: { type: 'LESSONS' },
      syllabus: {
        sections: [{ title: 'S1', lessons: [{ id: 'l1' }, { id: 'l2' }] }],
      },
    });
    expect(policy).toMatchObject({
      type: TrackingType.LESSONS,
      enabled: true,
      lessonIds: ['l1', 'l2'],
    });
    expect(serializeTrackingPolicy(policy).metadata).toEqual({
      total_lessons: 2,
    });
  });

  it('disables lesson tracking without a syllabus', () => {
    expect(
      resolveTrackingPolicy(RoadmapItemType.COURSE, {
        tracking: { type: 'LESSONS' },
      }),
    ).toMatchObject({ enabled: false, disabledReason: 'SYLLABUS_MISSING' });
  });

  it('uses challenge review for historical challenges', () => {
    expect(resolveTrackingPolicy(RoadmapItemType.CHALLENGE, {}).type).toBe(
      TrackingType.CHALLENGE,
    );
  });

  it('reads trusted video metadata', () => {
    expect(
      resolveTrackingPolicy(RoadmapItemType.MEDIA, {
        tracking: { type: 'VIDEO', durationSeconds: 600 },
      }),
    ).toMatchObject({
      type: TrackingType.VIDEO,
      enabled: true,
      disabledReason: null,
      durationSeconds: 600,
      acceptedSubmissionTypes: [],
    });
  });

  it('disables video tracking without a trusted duration', () => {
    expect(
      resolveTrackingPolicy(RoadmapItemType.MEDIA, {
        tracking: { type: 'VIDEO', durationSeconds: 0 },
      }),
    ).toMatchObject({
      enabled: false,
      disabledReason: 'TRACKING_METADATA_MISSING',
      durationSeconds: null,
    });
  });

  it('applies challenge defaults when the item has no explicit rules', () => {
    expect(resolveTrackingPolicy(RoadmapItemType.CHALLENGE, {})).toMatchObject({
      acceptedSubmissionTypes: Object.values(SubmissionType),
      allowedLanguages: DEFAULT_CHALLENGE_LANGUAGES,
      allowedFileExtensions: DEFAULT_CHALLENGE_FILE_EXTENSIONS,
      maxFileSizeBytes: MAX_CHALLENGE_FILE_BYTES,
    });
  });

  it('normalizes explicit challenge rules and caps the file size', () => {
    expect(
      resolveTrackingPolicy(RoadmapItemType.CHALLENGE, {
        tracking: {
          acceptedSubmissionTypes: ['CODE', 'FILE', 'UNKNOWN'],
          allowedLanguages: [' TypeScript '],
          allowedFileExtensions: ['ZIP', '.pdf'],
          maxFileSizeBytes: MAX_CHALLENGE_FILE_BYTES * 10,
        },
      }),
    ).toMatchObject({
      acceptedSubmissionTypes: [SubmissionType.CODE, SubmissionType.FILE],
      allowedLanguages: ['typescript'],
      allowedFileExtensions: ['.zip', '.pdf'],
      maxFileSizeBytes: MAX_CHALLENGE_FILE_BYTES,
    });
  });
});

describe('serializeTrackingPolicy', () => {
  it('exposes the report interval and duration for videos', () => {
    expect(
      serializeTrackingPolicy(
        resolveTrackingPolicy(RoadmapItemType.MEDIA, {
          tracking: { type: 'VIDEO', durationSeconds: 600 },
        }),
      ),
    ).toEqual({
      type: TrackingType.VIDEO,
      enabled: true,
      disabled_reason: null,
      report_interval_seconds: VIDEO_REPORT_INTERVAL_SECONDS,
      metadata: { duration_seconds: 600 },
    });
  });

  it('omits heartbeats for manual items', () => {
    expect(
      serializeTrackingPolicy(
        resolveTrackingPolicy(RoadmapItemType.COURSE, {}),
      ),
    ).toEqual({
      type: TrackingType.COMPLETION,
      enabled: true,
      disabled_reason: null,
      report_interval_seconds: null,
      metadata: null,
    });
  });

  it('exposes the form rules for challenges', () => {
    expect(
      serializeTrackingPolicy(
        resolveTrackingPolicy(RoadmapItemType.CHALLENGE, {}),
      ),
    ).toMatchObject({
      type: TrackingType.CHALLENGE,
      report_interval_seconds: null,
      accepted_submission_types: Object.values(SubmissionType),
      allowed_languages: DEFAULT_CHALLENGE_LANGUAGES,
      allowed_file_extensions: DEFAULT_CHALLENGE_FILE_EXTENSIONS,
      max_file_size_bytes: MAX_CHALLENGE_FILE_BYTES,
    });
  });
});
