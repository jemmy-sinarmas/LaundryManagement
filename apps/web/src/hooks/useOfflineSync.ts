import { useEffect } from 'react';
import { api } from '@/lib/api';
import { usePosStore } from '@/store/posStore';
import { syncPendingOrders } from '@/lib/offlineSync';
import type { Order } from '@laundry-palu/shared';

export function useOfflineSync() {
  const { pendingOrders, removePendingOrder } = usePosStore();

  const syncPending = () =>
    syncPendingOrders([...pendingOrders], {
      post: (payload) => api.post<Order>('/api/v1/orders', payload),
      remove: removePendingOrder,
    });

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
