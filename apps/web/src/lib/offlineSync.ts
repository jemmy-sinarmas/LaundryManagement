import type { PendingOrder } from '@/store/posStore';

/** The order payload sent to the API, without the local-only `timestamp` field. */
export type PendingOrderPayload = Omit<PendingOrder, 'timestamp'>;

export type SyncDeps = {
  /** Posts one queued order to the API. Rejects when still offline / the call fails. */
  post: (payload: PendingOrderPayload) => Promise<unknown>;
  /** Removes a successfully-synced order from the queue by its timestamp. */
  remove: (timestamp: number) => void;
};

/**
 * Drain the offline order queue in order. Each order is posted and, on success,
 * removed from the queue. On the first failure we stop immediately and leave the
 * remaining orders queued — we're likely still offline, so retry on the next
 * `online` event rather than hammering a dead connection.
 */
export async function syncPendingOrders(pending: PendingOrder[], deps: SyncDeps): Promise<void> {
  for (const order of pending) {
    const { timestamp, ...payload } = order;
    try {
      await deps.post(payload);
      deps.remove(timestamp);
    } catch {
      break;
    }
  }
}
