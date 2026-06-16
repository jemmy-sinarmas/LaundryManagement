import { describe, it, expect, vi } from 'vitest';
import type { PendingOrder } from '@/store/posStore';
import { syncPendingOrders } from '@/lib/offlineSync';

function pending(timestamp: number): PendingOrder {
  return {
    timestamp,
    customerId: `cust-${timestamp}`,
    catatan: null,
    metodePembayaran: 'tunai',
    items: [{ itemId: 'item-1', qty: 1 }],
  };
}

describe('syncPendingOrders', () => {
  it('posts every queued order in order and removes each on success', async () => {
    const post = vi.fn().mockResolvedValue({});
    const remove = vi.fn();
    const queue = [pending(1), pending(2), pending(3)];

    await syncPendingOrders(queue, { post, remove });

    expect(post).toHaveBeenCalledTimes(3);
    expect(remove.mock.calls.map((c) => c[0])).toEqual([1, 2, 3]);
  });

  it('strips the timestamp from the posted payload', async () => {
    const post = vi.fn().mockResolvedValue({});
    const remove = vi.fn();

    await syncPendingOrders([pending(42)], { post, remove });

    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'cust-42', metodePembayaran: 'tunai' })
    );
    expect(post.mock.calls[0]?.[0]).not.toHaveProperty('timestamp');
  });

  it('stops on the first failure and leaves the rest queued', async () => {
    const post = vi
      .fn()
      .mockResolvedValueOnce({}) // first succeeds
      .mockRejectedValueOnce(new Error('offline')); // second fails
    const remove = vi.fn();
    const queue = [pending(1), pending(2), pending(3)];

    await syncPendingOrders(queue, { post, remove });

    expect(post).toHaveBeenCalledTimes(2); // never attempts the third
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(1); // only the first was removed
  });

  it('does nothing for an empty queue', async () => {
    const post = vi.fn();
    const remove = vi.fn();

    await syncPendingOrders([], { post, remove });

    expect(post).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});
