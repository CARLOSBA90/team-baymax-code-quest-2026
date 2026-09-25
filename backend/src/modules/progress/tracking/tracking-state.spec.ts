import { TRACKING_STATE_SCHEMA_VERSION } from '../progress.constants.js';
import { contentFingerprint, readTrackingState } from './tracking-state.js';

describe('tracking state', () => {
  it('produces the same fingerprint for the same content', () => {
    expect(contentFingerprint({ type: 'TEXT', content: 'hola' })).toBe(
      contentFingerprint({ type: 'TEXT', content: 'hola' }),
    );
    expect(contentFingerprint({ type: 'TEXT', content: 'hola' })).not.toBe(
      contentFingerprint({ type: 'TEXT', content: 'adiós' }),
    );
  });

  it('keeps resume positions and drops legacy event receipts', () => {
    expect(
      readTrackingState({
        lastPositionSeconds: 90,
        maxPositionSeconds: 135,
        receipts: [{ eventId: 'old', payloadHash: 'x', processedAt: 'y' }],
      }),
    ).toEqual({
      schemaVersion: TRACKING_STATE_SCHEMA_VERSION,
      lastPositionSeconds: 90,
      maxPositionSeconds: 135,
    });
  });

  it('keeps valid lesson positions and drops malformed ones', () => {
    expect(
      readTrackingState({ lessonPositions: { l1: 30 } }).lessonPositions,
    ).toEqual({ l1: 30 });
    expect(
      readTrackingState({ lessonPositions: { l1: 'x' } }),
    ).not.toHaveProperty('lessonPositions');
  });

  it('tolerates missing or malformed state', () => {
    expect(readTrackingState(null)).toEqual({
      schemaVersion: TRACKING_STATE_SCHEMA_VERSION,
    });
    expect(readTrackingState(['not', 'an', 'object'])).toEqual({
      schemaVersion: TRACKING_STATE_SCHEMA_VERSION,
    });
  });
});
