'use client';
import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useLangStore } from '@/store/langStore';
import { toast } from '@/store/toastStore';
import type { AppSettings, Order } from '@laundry-palu/shared';
import PrintableInvoice from '@/components/invoice/PrintableInvoice';

type FormState = Omit<AppSettings, never>;

const SAMPLE_ORDER: Order = {
  id: 'demo',
  invoiceNo: 'INV-DEMO-20260609-0001',
  customerId: 'demo',
  membershipId: null,
  diskonPersen: 10,
  subtotal: 45000,
  diskonAmount: 4500,
  promoId: null,
  promoDiskonAmount: 0,
  gratuityAmount: 0,
  ppnAmount: 0,
  total: 40500,
  metodePembayaran: 'tunai',
  jumlahDibayar: 40500,
  status: 'siap_diambil',
  catatan: 'Harap dijaga dengan baik.',
  branchId: null,
  pickupToken: 'demo-token',
  createdBy: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customer: { id: 'demo', nama: 'Budi Santoso', noHp: '08123456789' },
  items: [
    { id: '1', orderId: 'demo', itemId: 'i1', namaItem: 'Cuci Kiloan', tipe: 'kiloan', harga: 9000, qty: 3, subtotal: 27000 },
    { id: '2', orderId: 'demo', itemId: 'i2', namaItem: 'Setrika', tipe: 'satuan', harga: 18000, qty: 1, subtotal: 18000 },
  ],
};

export default function SettingsPage() {
  const { settings, loading, error, updateSettings } = useSettings();
  const { t } = useLangStore();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings && !form) {
      setForm({ ...settings });
    }
  }, [settings, form]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, logoBase64: reader.result as string });
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success(t.settings.save_success);
    } catch {
      toast.error(t.common.error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400">{t.common.loading}</p>;
  if (error) return <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!form) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-gray-500">Konfigurasi bisnis dan template invoice.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">{t.settings.subtitle_business}</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t.settings.business_name}</label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t.settings.address}</label>
            <input
              type="text"
              value={form.businessAddress}
              onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
              placeholder="Jl. ..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t.settings.phone}</label>
            <input
              type="tel"
              value={form.businessPhone}
              onChange={(e) => setForm({ ...form, businessPhone: e.target.value })}
              placeholder="+62..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">{t.settings.subtitle_tax}</h2>
          <p className="text-xs text-gray-400">Isi 0 untuk menonaktifkan. Nilai digunakan pada setiap pesanan baru.</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.settings.ppn}</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.ppnPercent}
                onChange={(e) => setForm({ ...form, ppnPercent: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">Contoh: 11 untuk PPN 11%</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.settings.service_fee}</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.gratuityPercent}
                onChange={(e) => setForm({ ...form, gratuityPercent: Number(e.target.value) })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">Contoh: 5 untuk biaya layanan 5%</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">{t.settings.subtitle_cash}</h2>
          <p className="text-xs text-gray-400">{t.settings.opening_balance_hint}</p>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t.settings.opening_balance} (IDR)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={form.saldoAwalKas}
              onChange={(e) => setForm({ ...form, saldoAwalKas: Math.max(0, Math.floor(Number(e.target.value))) })}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">{t.settings.subtitle_invoice}</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t.settings.invoice_footer}</label>
            <textarea
              value={form.invoiceFooter}
              onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{t.settings.logo_upload}</label>
            {form.logoBase64 && (
              <img
                src={form.logoBase64}
                alt="Logo preview"
                className="mb-2 h-16 rounded border object-contain"
              />
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoChange}
              className="block text-sm text-gray-500 file:mr-3 file:rounded file:border file:border-gray-300 file:bg-white file:px-3 file:py-1 file:text-sm hover:file:bg-gray-50"
            />
            {form.logoBase64 && (
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, logoBase64: '' });
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="mt-1 text-xs text-red-500 hover:underline"
              >
                Hapus logo
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="rounded border px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Preview Nota
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t.common.saving : t.common.save}
          </button>
        </div>
      </form>

      {showPreview && (
        <PrintableInvoice order={SAMPLE_ORDER} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}
