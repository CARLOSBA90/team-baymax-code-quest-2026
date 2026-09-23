import {
  TRACKING_RECEIPT_LIMIT,
  TRACKING_STATE_SCHEMA_VERSION,
} from '../progress.constants.js';
import {
  activeReceipts,
  payloadHash,
  readTrackingState,
} from './tracking-receipts.service.js';

describe('tracking receipts', () => {
  it('creates stable hashes for the same payload', () => {
    expect(payloadHash({ type: 'VIDEO', position_seconds: 135 })).toBe(
      payloadHash({ type: 'VIDEO', position_seconds: 135 }),
    );
  });

  it('drops expired receipts and bounds retained receipts', () => {
    const now = new Date('2026-09-24T12:00:00.000Z');
    const recent = Array.from(
      { length: TRACKING_RECEIPT_LIMIT + 5 },
      (_, index) => ({
        eventId: String(index),
        payloadHash: 'hash',
        processedAt: now.toISOString(),
      }),
    );
    const receipts = activeReceipts(
      [
        {
          eventId: 'expired',
          payloadHash: 'hash',
          processedAt: '2026-09-22T00:00:00.000Z',
        },
        ...recent,
      ],
      now,
    );
    expect(receipts).toHaveLength(TRACKING_RECEIPT_LIMIT);
    expect(receipts.some((receipt) => receipt.eventId === 'expired')).toBe(
      false,
    );
  });

  it('normalizes missing state without trusting arbitrary JSON', () => {
    expect(readTrackingState(null)).toEqual({
      schemaVersion: TRACKING_STATE_SCHEMA_VERSION,
      receipts: [],
    });
  });
});
