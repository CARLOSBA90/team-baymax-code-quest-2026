import { createHash } from 'node:crypto';
import {
  TRACKING_RECEIPT_LIMIT,
  TRACKING_RECEIPT_TTL_MS,
  TRACKING_STATE_SCHEMA_VERSION,
} from '../progress.constants.js';

export interface TrackingReceipt {
  eventId: string;
  payloadHash: string;
  processedAt: string;
}

export interface TrackingState {
  schemaVersion: number;
  lastPositionSeconds?: number;
  maxPositionSeconds?: number;
  receipts: TrackingReceipt[];
}

export function readTrackingState(value: unknown): TrackingState {
  const state =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    schemaVersion: TRACKING_STATE_SCHEMA_VERSION,
    ...(typeof state.lastPositionSeconds === 'number' && {
      lastPositionSeconds: state.lastPositionSeconds,
    }),
    ...(typeof state.maxPositionSeconds === 'number' && {
      maxPositionSeconds: state.maxPositionSeconds,
    }),
    receipts: Array.isArray(state.receipts)
      ? (state.receipts.filter(
          (receipt) =>
            receipt && typeof receipt === 'object' && !Array.isArray(receipt),
        ) as TrackingReceipt[])
      : [],
  };
}

export function payloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function activeReceipts(
  receipts: TrackingReceipt[],
  now: Date,
): TrackingReceipt[] {
  const cutoff = now.getTime() - TRACKING_RECEIPT_TTL_MS;
  return receipts
    .filter((receipt) => new Date(receipt.processedAt).getTime() >= cutoff)
    .slice(-TRACKING_RECEIPT_LIMIT);
}
