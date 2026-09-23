import { RoadmapItemType } from '../../../generated/prisma/enums.js';
import { TrackingType } from '../progress.constants.js';
import { resolveTrackingPolicy } from './tracking-policy.resolver.js';

describe('resolveTrackingPolicy', () => {
  it('keeps historical courses manual', () => {
    expect(resolveTrackingPolicy(RoadmapItemType.COURSE, {}).type).toBe(
      TrackingType.MANUAL,
    );
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
    ).toEqual({
      type: TrackingType.VIDEO,
      durationSeconds: 600,
      acceptedSubmissionTypes: [],
    });
  });
});
