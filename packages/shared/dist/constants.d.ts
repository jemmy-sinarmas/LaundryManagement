export declare const ORDER_STATUSES: readonly ["diterima", "dicuci", "dikeringkan", "dibungkus", "siap_diambil", "selesai"];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export declare const MEMBERSHIP_TYPES: readonly ["periodik", "paket_kg"];
export type MembershipType = (typeof MEMBERSHIP_TYPES)[number];
export declare const ITEM_TYPES: readonly ["satuan", "kiloan", "jasa_lain"];
export type ItemType = (typeof ITEM_TYPES)[number];
export declare const EXPENSE_LEVELS: readonly ["variabel", "tetap"];
export type ExpenseLevel = (typeof EXPENSE_LEVELS)[number];
export declare const USER_ROLES: readonly ["admin", "kasir"];
export type UserRole = (typeof USER_ROLES)[number];
export declare const INVENTORY_TRANSACTION_TYPES: readonly ["masuk", "keluar"];
export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number];
export declare const PERIODIK_DISCOUNT_PERCENT = 10;
export declare const PAKET_KG_LOW_BALANCE_THRESHOLD = 5;
export declare const PAKET_KG_OPTIONS: readonly [50, 100, 200];
export declare const PERIODIK_DURATION_OPTIONS: readonly [3, 6, 12];
export declare function getPreviousStatus(status: OrderStatus): OrderStatus | null;
//# sourceMappingURL=constants.d.ts.map