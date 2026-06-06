import { create } from 'zustand';

export type Toast = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
};

type ToastState = {
  toasts: Toast[];
  push: (message: string, type?: Toast['type']) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      3500
    );
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Callable outside React components (e.g. in hook callbacks)
export const toast = {
  success: (msg: string) => useToastStore.getState().push(msg, 'success'),
  error:   (msg: string) => useToastStore.getState().push(msg, 'error'),
  info:    (msg: string) => useToastStore.getState().push(msg, 'info'),
};
