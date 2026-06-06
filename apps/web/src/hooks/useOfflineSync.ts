import { useEffect } from 'react';
import { api } from '@/lib/api';
import { usePosStore } from '@/store/posStore';
import type { Order } from '@laundry-palu/shared';

export function useOfflineSync() {
  const { pendingOrders, removePendingOrder } = usePosStore();

  const syncPending = async () => {
    for (const pending of [...pendingOrders]) {
      const { timestamp, ...payload } = pending;
      try {
        await api.post<Order>('/api/v1/orders', payload);
        removePendingOrder(timestamp);
      } catch {
        break; // still offline — stop and retry on next online event
      }
    }
  };

  useEffect(() => {
    // Attempt sync immediately if there are pending orders and we're online
    if (pendingOrders.length > 0 && navigator.onLine) {
      void syncPending();
    }

    const handleOnline = () => { void syncPending(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOrders.length]);

  return { pendingCount: pendingOrders.length };
}
