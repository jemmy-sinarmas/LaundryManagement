'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Order } from '@laundry-palu/shared';
import TrackOrderView from '@/components/TrackOrderView';

export default function TrackByTokenPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.get<Order>(`/api/v1/track/t/${token}`);
      setOrder(data);
      setNotFound(false);
    } catch {
      setNotFound(true);
    }
  }, [token]);

  useEffect(() => {
    void fetchOrder().finally(() => setLoading(false));
  }, [fetchOrder]);

  async function handleRefresh() {
    setRefreshing(true);
    try { await fetchOrder(); } finally { setRefreshing(false); }
  }

  return (
    <TrackOrderView
      order={order}
      loading={loading}
      notFound={notFound}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      identifier="QR code"
    />
  );
}
