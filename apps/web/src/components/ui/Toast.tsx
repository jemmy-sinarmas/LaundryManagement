'use client';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const TYPE_STYLES = {
  success: 'border-l-green-500 bg-green-50 text-green-900',
  error:   'border-l-red-500   bg-red-50   text-red-900',
  info:    'border-l-blue-500  bg-blue-50  text-blue-900',
};

const TYPE_ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[200] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = TYPE_ICONS[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border-l-4 p-3 shadow-lg',
              TYPE_STYLES[t.type]
            )}
          >
            <Icon size={16} className="mt-0.5 flex-shrink-0 opacity-80" />
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
