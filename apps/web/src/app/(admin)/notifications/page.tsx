'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useLangStore } from '@/store/langStore';
import { toast } from '@/store/toastStore';
import Breadcrumb from '@/components/ui/Breadcrumb';

type NotificationLogEntry = {
  id: string;
  orderId: string | null;
  invoiceNo: string | null;
  type: string;
  toNumber: string;
  message: string;
  status: string;
  error: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  sent:    'bg-green-100 text-green-700',
  skipped: 'bg-yellow-100 text-yellow-700',
  failed:  'bg-red-100 text-red-700',
};

export default function NotificationsPage() {
  const { t } = useLangStore();
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<NotificationLogEntry[]>('/api/v1/notification-log');
      setLogs(data);
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  function typeLabel(type: string): string {
    if (type === 'payment_receipt') return t.notifications.type_payment;
    if (type === 'ready_for_collection') return t.notifications.type_ready;
    return type;
  }

  function statusLabel(status: string): string {
    if (status === 'sent')    return t.notifications.status_sent;
    if (status === 'skipped') return t.notifications.status_skipped;
    if (status === 'failed')  return t.notifications.status_failed;
    return status;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: t.notifications.title }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.notifications.title}</h1>
        <button
          onClick={() => void fetchLogs()}
          className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          {t.common.refresh}
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">{t.common.loading}</p>
        ) : logs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">{t.notifications.empty}</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Waktu', 'Tipe', 'Tujuan', 'Invoice', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{typeLabel(log.type)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{log.toNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {log.invoiceNo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[log.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {statusLabel(log.status)}
                      </span>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={5} className="bg-gray-50 px-6 py-4">
                        {log.error && (
                          <p className="mb-2 text-xs text-red-600">Error: {log.error}</p>
                        )}
                        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border bg-white p-3 text-xs text-gray-700">
                          {log.message}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
