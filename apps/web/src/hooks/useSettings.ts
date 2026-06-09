import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AppSettings } from '@laundry-palu/shared';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<AppSettings>('/api/v1/settings');
      setSettings(data);
    } catch {
      setError('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSettings(); }, [fetchSettings]);

  async function updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const data = await api.patch<AppSettings>('/api/v1/settings', updates);
    setSettings(data);
    return data;
  }

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
}
