export const ORDER_STATUSES = [
    'diterima',
    'dicuci',
    'dikeringkan',
    'dibungkus',
    'siap_diambil',
    'selesai',
];
export const MEMBERSHIP_TYPES = ['periodik', 'paket_kg'];
export const ITEM_TYPES = ['satuan', 'kiloan', 'jasa_lain'];
export const EXPENSE_LEVELS = ['variabel', 'tetap'];
export const USER_ROLES = ['admin', 'kasir'];
export const INVENTORY_TRANSACTION_TYPES = ['masuk', 'keluar'];
export const PERIODIK_DISCOUNT_PERCENT = 10;
export const PAKET_KG_LOW_BALANCE_THRESHOLD = 5;
export const PAKET_KG_OPTIONS = [50, 100, 200];
export const PERIODIK_DURATION_OPTIONS = [3, 6, 12];
export function getPreviousStatus(status) {
    const idx = ORDER_STATUSES.indexOf(status);
    return idx > 0 ? (ORDER_STATUSES[idx - 1] ?? null) : null;
}
//# sourceMappingURL=constants.js.map