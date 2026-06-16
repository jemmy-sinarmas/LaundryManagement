'use client';
import { useState } from 'react';
import { PERIODIK_DURATION_OPTIONS, PAKET_KG_OPTIONS } from '@laundry-palu/shared';
import { toast } from '@/store/toastStore';

type Props = {
  onSubmit: (data: object) => Promise<void>;
  onCancel?: () => void;
};

export default function MembershipForm({ onSubmit, onCancel }: Props) {
  const [tipe, setTipe] = useState<'periodik' | 'paket_kg'>('periodik');
  const [durasibulan, setDurasibulan] = useState<number>(3);
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().slice(0, 10));
  const [paketKg, setPaketKg] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data =
        tipe === 'periodik'
          ? { tipe, durasibulan, tanggalMulai }
          : { tipe, paketKg };
      await onSubmit(data);
    } catch (err) {
      // Surface the real failure reason when the API provides one, falling back to
      // a generic message; also toast it so it is visible even outside the form.
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Gagal membuat keanggotaan. Coba lagi.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Tipe Keanggotaan</label>
        <div className="flex gap-4">
          {(['periodik', 'paket_kg'] as const).map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={t}
                checked={tipe === t}
                onChange={() => setTipe(t)}
                className="text-blue-600"
              />
              <span className="text-sm">{t === 'periodik' ? 'Periodik' : 'Paket Kg'}</span>
            </label>
          ))}
        </div>
      </div>

      {tipe === 'periodik' ? (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Durasi</label>
            <select
              value={durasibulan}
              onChange={(e) => setDurasibulan(Number(e.target.value))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {PERIODIK_DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} bulan</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tanggal Mulai</label>
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Paket Kg</label>
          <select
            value={paketKg}
            onChange={(e) => setPaketKg(Number(e.target.value))}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {PAKET_KG_OPTIONS.map((kg) => (
              <option key={kg} value={kg}>{kg} kg</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Keanggotaan'}
        </button>
      </div>
    </form>
  );
}
