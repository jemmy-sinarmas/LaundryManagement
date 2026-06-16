import { describe, it, expect, beforeEach } from 'vitest';
import type { Item } from '@laundry-palu/shared';
import { usePosStore, type PendingOrder } from '@/store/posStore';

function item(id: string, harga = 10000): Item {
  return {
    id,
    nama: `Item ${id}`,
    tipe: 'satuan',
    harga,
    isActive: true,
    branchId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function pending(timestamp: number): PendingOrder {
  return {
    timestamp,
    customerId: 'cust-1',
    catatan: null,
    metodePembayaran: 'tunai',
    items: [{ itemId: 'item-1', qty: 1 }],
  };
}

beforeEach(() => {
  usePosStore.setState({ cart: [], pendingOrders: [] });
});

describe('posStore — cart', () => {
  it('adds a new item with a default qty of 1', () => {
    usePosStore.getState().addToCart(item('a'));
    expect(usePosStore.getState().cart).toEqual([{ item: item('a'), qty: 1 }]);
  });

  it('merges quantity when the same item is added again', () => {
    const { addToCart } = usePosStore.getState();
    addToCart(item('a'), 2);
    addToCart(item('a'), 3);
    const cart = usePosStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0]?.qty).toBe(5);
  });

  it('appends distinct items', () => {
    const { addToCart } = usePosStore.getState();
    addToCart(item('a'));
    addToCart(item('b'));
    expect(usePosStore.getState().cart.map((c) => c.item.id)).toEqual(['a', 'b']);
  });

  it('updateQty sets an absolute quantity', () => {
    const { addToCart, updateQty } = usePosStore.getState();
    addToCart(item('a'), 1);
    updateQty('a', 7);
    expect(usePosStore.getState().cart[0]?.qty).toBe(7);
  });

  it('removeFromCart drops the matching line', () => {
    const { addToCart, removeFromCart } = usePosStore.getState();
    addToCart(item('a'));
    addToCart(item('b'));
    removeFromCart('a');
    expect(usePosStore.getState().cart.map((c) => c.item.id)).toEqual(['b']);
  });

  it('clearCart empties the cart', () => {
    const { addToCart, clearCart } = usePosStore.getState();
    addToCart(item('a'));
    clearCart();
    expect(usePosStore.getState().cart).toEqual([]);
  });
});

describe('posStore — pending orders', () => {
  it('addPendingOrder appends to the queue', () => {
    const { addPendingOrder } = usePosStore.getState();
    addPendingOrder(pending(1));
    addPendingOrder(pending(2));
    expect(usePosStore.getState().pendingOrders.map((o) => o.timestamp)).toEqual([1, 2]);
  });

  it('removePendingOrder removes by timestamp', () => {
    const { addPendingOrder, removePendingOrder } = usePosStore.getState();
    addPendingOrder(pending(1));
    addPendingOrder(pending(2));
    removePendingOrder(1);
    expect(usePosStore.getState().pendingOrders.map((o) => o.timestamp)).toEqual([2]);
  });
});
