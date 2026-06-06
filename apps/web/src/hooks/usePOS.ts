import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { usePosStore } from '@/store/posStore';
import type { Customer, Item, MembershipValidationResult, Order } from '@laundry-palu/shared';

export function usePOS() {
  const [items, setItems] = useState<Item[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { cart, addToCart, updateQty, removeFromCart, clearCart, addPendingOrder } = usePosStore();

  // Load items on mount
  useEffect(() => {
    api.get<Item[]>('/api/v1/items').then(setItems).catch(() => null);
  }, []);

  // Search customers with debounce
  useEffect(() => {
    if (!customerQuery.trim()) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await api.get<Customer[]>(
          `/api/v1/customers?q=${encodeURIComponent(customerQuery.trim())}`
        );
        setCustomerResults(results);
      } catch {
        setCustomerResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  const selectCustomer = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerQuery('');
    setCustomerResults([]);
    try {
      const v = await api.get<MembershipValidationResult>(
        `/api/v1/customers/${customer.id}/membership/validate`
      );
      setDiscountPercent(v.discountPercent);
    } catch {
      setDiscountPercent(0);
    }
  }, []);

  const subtotal = cart.reduce((s, c) => s + Math.floor(c.item.harga * c.qty), 0);
  const diskonAmount = Math.floor((subtotal * discountPercent) / 100);
  const total = subtotal - diskonAmount;

  async function submitOrder(catatan?: string) {
    if (!selectedCustomer) throw new Error('Pilih pelanggan terlebih dahulu');
    if (cart.length === 0) throw new Error('Keranjang kosong');

    const payload = {
      customerId: selectedCustomer.id,
      catatan: catatan ?? null,
      items: cart.map((c) => ({ itemId: c.item.id, qty: c.qty })),
    };

    setSubmitting(true);
    try {
      const order = await api.post<Order>('/api/v1/orders', payload);
      clearCart();
      setSelectedCustomer(null);
      setDiscountPercent(0);
      setCreatedOrder(order);
      return order;
    } catch {
      // Save to offline queue so it syncs on reconnect
      addPendingOrder({ ...payload, timestamp: Date.now() });
      throw new Error('Jaringan bermasalah. Pesanan disimpan ke antrian offline.');
    } finally {
      setSubmitting(false);
    }
  }

  function clearCreatedOrder() {
    setCreatedOrder(null);
  }

  return {
    items,
    customerQuery,
    setCustomerQuery,
    customerResults,
    selectedCustomer,
    selectCustomer,
    discountPercent,
    cart,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    subtotal,
    diskonAmount,
    total,
    createdOrder,
    clearCreatedOrder,
    submitting,
    submitOrder,
  };
}
