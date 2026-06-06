import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Item } from '@laundry-palu/shared';

export type CartItem = { item: Item; qty: number };

export type PendingOrder = {
  timestamp: number;
  customerId: string;
  catatan: string | null;
  items: { itemId: string; qty: number }[];
};

type PosState = {
  cart: CartItem[];
  addToCart: (item: Item, qty?: number) => void;
  updateQty: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  pendingOrders: PendingOrder[];
  addPendingOrder: (order: PendingOrder) => void;
  removePendingOrder: (timestamp: number) => void;
};

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (item, qty = 1) =>
        set((s) => {
          const existing = s.cart.find((c) => c.item.id === item.id);
          if (existing) {
            return { cart: s.cart.map((c) => c.item.id === item.id ? { ...c, qty: c.qty + qty } : c) };
          }
          return { cart: [...s.cart, { item, qty }] };
        }),
      updateQty: (itemId, qty) =>
        set((s) => ({ cart: s.cart.map((c) => c.item.id === itemId ? { ...c, qty } : c) })),
      removeFromCart: (itemId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.item.id !== itemId) })),
      clearCart: () => set({ cart: [] }),
      pendingOrders: [],
      addPendingOrder: (order) =>
        set((s) => ({ pendingOrders: [...s.pendingOrders, order] })),
      removePendingOrder: (timestamp) =>
        set((s) => ({ pendingOrders: s.pendingOrders.filter((o) => o.timestamp !== timestamp) })),
    }),
    { name: 'pos-store' }
  )
);
