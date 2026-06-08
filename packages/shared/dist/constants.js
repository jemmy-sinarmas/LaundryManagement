"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERIODIK_DURATION_OPTIONS = exports.PAKET_KG_OPTIONS = exports.PAKET_KG_LOW_BALANCE_THRESHOLD = exports.PERIODIK_DISCOUNT_PERCENT = exports.INVENTORY_TRANSACTION_TYPES = exports.USER_ROLES = exports.EXPENSE_LEVELS = exports.ITEM_TYPES = exports.MEMBERSHIP_TYPES = exports.ORDER_STATUSES = void 0;
exports.ORDER_STATUSES = [
    'diterima',
    'dicuci',
    'dikeringkan',
    'dibungkus',
    'siap_diambil',
    'selesai',
];
exports.MEMBERSHIP_TYPES = ['periodik', 'paket_kg'];
exports.ITEM_TYPES = ['satuan', 'kiloan', 'jasa_lain'];
exports.EXPENSE_LEVELS = ['variabel', 'tetap'];
exports.USER_ROLES = ['admin', 'kasir'];
exports.INVENTORY_TRANSACTION_TYPES = ['masuk', 'keluar'];
exports.PERIODIK_DISCOUNT_PERCENT = 10;
exports.PAKET_KG_LOW_BALANCE_THRESHOLD = 5;
exports.PAKET_KG_OPTIONS = [50, 100, 200];
exports.PERIODIK_DURATION_OPTIONS = [3, 6, 12];
//# sourceMappingURL=constants.js.map