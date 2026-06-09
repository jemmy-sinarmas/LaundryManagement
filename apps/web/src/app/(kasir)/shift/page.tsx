'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatIDR } from '@/lib/utils';
import { toast } from '@/store/toastStore';
import type { Shift } from '@laundry-palu/shared';
import { Clock, Play, Square } from 'lucide-react';

function formatDuration(startTime: string): string {
  const ms = Date.now() - new Date(startTime).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ShiftPage() {
  const [shift, setShift] = useState<Shift | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [startCash, setStartCash] = useState('');
  const [endCash, setEndCash] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [, setTick] = useState(0);

  const fetchCurrent = useCallback(async () => {
    try {
      const data = await api.get<Shift | null>('/api/v1/shifts/current');
      setShift(data);
    } catch {
      setShift(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCurrent();
  }, [fetchCurrent]);

  // live duration timer
  useEffect(() => {
    if (!shift) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [shift]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/shifts/start', { startCash: Number(startCash) });
      toast.success('Shift dimulai');
      setStartCash('');
      await fetchCurrent();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memulai shift');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEnd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/v1/shifts/end', { endCash: Number(endCash), notes: notes || undefined });
      toast.success('Shift diakhiri');
      setEndCash('');
      setNotes('');
      await fetchCurrent();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengakhiri shift');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        Memuat...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <Clock size={22} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900">Manajemen Shift</h1>
      </div>

      {shift ? (
        <>
          {/* Active shift info */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-green-700">Shift Aktif</span>
              <span className="rounded-full bg-green-200 px-2 py-0.5 font-mono text-sm text-green-800">
                {formatDuration(shift.startTime)}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Mulai</span>
                <span>{new Date(shift.startTime).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Modal Awal</span>
                <span className="font-medium">{formatIDR(shift.startCash)}</span>
              </div>
            </div>
          </div>

          {/* End shift form */}
          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Akhiri Shift</h2>
            <form onSubmit={(e) => void handleEnd(e)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Modal Akhir (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={endCash}
                  onChange={(e) => setEndCash(e.target.value)}
                  required
                  placeholder="0"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Catatan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Opsional..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Square size={16} />
                {submitting ? 'Mengakhiri...' : 'Akhiri Shift'}
              </button>
            </form>
          </div>
        </>
      ) : (
        /* No active shift — show start form */
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Mulai Shift Baru</h2>
          <form onSubmit={(e) => void handleStart(e)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Modal Awal (Rp)</label>
              <input
                type="number"
                min={0}
                value={startCash}
                onChange={(e) => setStartCash(e.target.value)}
                required
                placeholder="Contoh: 200000"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">Masukkan jumlah uang tunai awal di laci kasir.</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Play size={16} />
              {submitting ? 'Memulai...' : 'Mulai Shift'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
