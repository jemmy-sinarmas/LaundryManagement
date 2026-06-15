'use client';
import { useState, useEffect } from 'react';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';
import { useSettings } from '@/hooks/useSettings';
import { toast } from '@/store/toastStore';
import { formatIDR } from '@/lib/utils';
import type { MessageTemplate, MessageTemplateType } from '@laundry-palu/shared';

const TEMPLATE_LABELS: Record<MessageTemplateType, { title: string; desc: string }> = {
  payment_receipt: {
    title: 'Struk Pembayaran',
    desc: 'Dikirim otomatis ke pelanggan saat kasir mencatat pembayaran.',
  },
  ready_for_collection: {
    title: 'Siap Diambil',
    desc: 'Dikirim otomatis saat pesanan berstatus "Siap Diambil".',
  },
};

// Sample data used only for the live preview (mirrors the backend renderer layout).
const SAMPLE = {
  invoiceNo: 'INV.063.260614.005',
  date: 'Minggu, 14 Jun 2026',
  creator: 'milawati-rcp',
  customerName: 'Robert',
  customerPhone: '+6281703798952',
  customerAddress: 'jl. Sriwijaya no.20',
  paymentMethod: 'Tunai',
  items: [
    { nama: 'Cuci Kering Setrika', qty: '5,0 Kg', subtotal: 55000 },
    { nama: 'Sepatu Casual', qty: '1 Pcs', subtotal: 37500 },
  ],
  discountPercent: 20,
  discount: 18500,
  total: 74000,
};

function fmt(n: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
}

function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k]! : m));
}

function buildPreview(type: MessageTemplateType, header: string, footer: string, businessName: string, businessPhone: string): string {
  const vars: Record<string, string> = {
    business_name: businessName || 'Laundry Palu',
    business_phone: businessPhone || '+62 822 XXXX XXXX',
    customer_name: SAMPLE.customerName,
    invoice_no: SAMPLE.invoiceNo,
    total: formatIDR(SAMPLE.total),
  };
  const lines: string[] = [substitute(header, vars), ''];
  if (type === 'payment_receipt') {
    lines.push(`Invoice #${SAMPLE.invoiceNo}`, SAMPLE.date, `Dibuat oleh: ${SAMPLE.creator}`, '');
    lines.push('Pelanggan', SAMPLE.customerName, SAMPLE.customerPhone, SAMPLE.customerAddress, '');
    lines.push('Metode Pembayaran', SAMPLE.paymentMethod, '');
    lines.push(`Order No: ${SAMPLE.invoiceNo}`);
    for (const it of SAMPLE.items) lines.push(`- ${it.nama}: ${it.qty} - ${fmt(it.subtotal)}`);
    lines.push(`Diskon ${SAMPLE.discountPercent}% - (${fmt(SAMPLE.discount)})`);
    lines.push(`Total Order: Rp ${fmt(SAMPLE.total)}`, '');
    lines.push('========================', `Total Invoice: Rp ${fmt(SAMPLE.total)}`, '');
  } else {
    lines.push(`Halo ${SAMPLE.customerName},`);
    lines.push(`Pesanan Anda dengan invoice #${SAMPLE.invoiceNo} sudah SIAP DIAMBIL. 🎉`, '');
    lines.push(`Total: Rp ${fmt(SAMPLE.total)}`, '');
  }
  lines.push(substitute(footer, vars));
  return lines.join('\n');
}

type Draft = { header: string; footer: string; isActive: boolean };

function TemplateCard({
  template,
  businessName,
  businessPhone,
  onSave,
}: {
  template: MessageTemplate;
  businessName: string;
  businessPhone: string;
  onSave: (type: MessageTemplateType, draft: Draft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>({
    header: template.header,
    footer: template.footer,
    isActive: template.isActive,
  });
  const [saving, setSaving] = useState(false);
  const label = TEMPLATE_LABELS[template.type];

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(template.type, draft);
      toast.success('Template berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan template. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{label.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{label.desc}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
          />
          Aktif
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Header</label>
            <textarea
              value={draft.header}
              onChange={(e) => setDraft({ ...draft, header: e.target.value })}
              rows={4}
              className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Footer / Syarat &amp; Ketentuan
            </label>
            <textarea
              value={draft.footer}
              onChange={(e) => setDraft({ ...draft, footer: e.target.value })}
              rows={6}
              className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <p className="text-xs text-gray-400">
            Placeholder yang tersedia: {'{business_name}'}, {'{business_phone}'},{' '}
            {'{customer_name}'}, {'{invoice_no}'}, {'{total}'}. Bagian rincian pesanan diisi
            otomatis oleh sistem.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Template'}
          </button>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Pratinjau</label>
          <pre className="h-full max-h-[28rem] overflow-auto whitespace-pre-wrap rounded border bg-gray-50 p-3 text-xs text-gray-800">
            {buildPreview(template.type, draft.header, draft.footer, businessName, businessPhone)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function MessageTemplatesPage() {
  const { templates, loading, error, updateTemplate } = useMessageTemplates();
  const { settings, updateSettings } = useSettings();

  const [waForm, setWaForm] = useState({
    whatsappEnabled: false,
    whatsappProvider: '',
    whatsappApiUrl: '',
    whatsappApiKey: '',
    whatsappSender: '',
  });
  const [waReady, setWaReady] = useState(false);
  const [savingWa, setSavingWa] = useState(false);

  useEffect(() => {
    if (settings && !waReady) {
      setWaForm({
        whatsappEnabled: settings.whatsappEnabled,
        whatsappProvider: settings.whatsappProvider,
        whatsappApiUrl: settings.whatsappApiUrl,
        whatsappApiKey: settings.whatsappApiKey,
        whatsappSender: settings.whatsappSender,
      });
      setWaReady(true);
    }
  }, [settings, waReady]);

  async function handleSaveTemplate(type: MessageTemplateType, draft: Draft) {
    await updateTemplate(type, draft);
  }

  async function handleSaveWa() {
    setSavingWa(true);
    try {
      await updateSettings(waForm);
      toast.success('Koneksi WhatsApp berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan koneksi WhatsApp.');
    } finally {
      setSavingWa(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Memuat...</p>;
  if (error)
    return (
      <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Template Pesan WhatsApp</h1>
        <p className="mt-1 text-sm text-gray-500">
          Atur pesan yang dikirim ke pelanggan saat pembayaran dan saat pesanan siap diambil.
        </p>
      </div>

      <div className="space-y-6">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            businessName={settings?.businessName ?? ''}
            businessPhone={settings?.businessPhone ?? ''}
            onSave={handleSaveTemplate}
          />
        ))}

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Koneksi WhatsApp</h2>
          <p className="mt-1 text-sm text-gray-500">
            Saat dinonaktifkan, pesan hanya dicatat di log (tidak dikirim). Aktifkan setelah
            kredensial penyedia diisi.
          </p>

          <div className="mt-4 max-w-2xl space-y-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={waForm.whatsappEnabled}
                onChange={(e) => setWaForm({ ...waForm, whatsappEnabled: e.target.checked })}
              />
              Aktifkan pengiriman WhatsApp
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Penyedia</label>
                <input
                  type="text"
                  value={waForm.whatsappProvider}
                  onChange={(e) => setWaForm({ ...waForm, whatsappProvider: e.target.value })}
                  placeholder="fonnte / wablas / ..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">No. Pengirim</label>
                <input
                  type="text"
                  value={waForm.whatsappSender}
                  onChange={(e) => setWaForm({ ...waForm, whatsappSender: e.target.value })}
                  placeholder="628..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">API URL</label>
              <input
                type="text"
                value={waForm.whatsappApiUrl}
                onChange={(e) => setWaForm({ ...waForm, whatsappApiUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">API Key / Token</label>
              <input
                type="password"
                value={waForm.whatsappApiKey}
                onChange={(e) => setWaForm({ ...waForm, whatsappApiKey: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveWa}
              disabled={savingWa}
              className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingWa ? 'Menyimpan...' : 'Simpan Koneksi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
