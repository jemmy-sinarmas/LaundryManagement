export const ORDER_STATUSES = [
  'diterima',
  'dicuci',
  'dikeringkan',
  'dibungkus',
  'siap_diambil',
  'selesai',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const MEMBERSHIP_TYPES = ['periodik', 'paket_kg'] as const;
export type MembershipType = (typeof MEMBERSHIP_TYPES)[number];

export const ITEM_TYPES = ['satuan', 'kiloan', 'jasa_lain'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const EXPENSE_LEVELS = ['variabel', 'tetap'] as const;
export type ExpenseLevel = (typeof EXPENSE_LEVELS)[number];

export const USER_ROLES = ['admin', 'kasir'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const INVENTORY_TRANSACTION_TYPES = ['masuk', 'keluar'] as const;
export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number];

// Payment methods captured for the daily cash-position report (Laporan Posisi Harian)
export const ORDER_PAYMENT_METHODS = ['tunai', 'qris', 'transfer_bca'] as const;
export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[number];

export const EXPENSE_PAYMENT_METHODS = ['tunai', 'transfer'] as const;
export type ExpensePaymentMethod = (typeof EXPENSE_PAYMENT_METHODS)[number];

export const PERIODIK_DISCOUNT_PERCENT = 10;
export const PAKET_KG_LOW_BALANCE_THRESHOLD = 5;

export const PAKET_KG_OPTIONS = [50, 100, 200] as const;
export const PERIODIK_DURATION_OPTIONS = [3, 6, 12] as const;

export function getPreviousStatus(status: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUSES.indexOf(status);
  return idx > 0 ? (ORDER_STATUSES[idx - 1] ?? null) : null;
}
