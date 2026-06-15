import type { ExpenseLevel, ExpensePaymentMethod, InventoryTransactionType, ItemType, MembershipType, MessageTemplateType, OrderPaymentMethod, OrderStatus, UserRole } from './constants.js';
export interface Branch {
    id: string;
    nama: string;
    kode: string;
    alamat: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface User {
    id: string;
    nama: string;
    username: string;
    role: UserRole;
    isActive: boolean;
    branchId: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface Customer {
    id: string;
    nama: string;
    alamat: string | null;
    noHp: string;
    countryCode: string;
    createdAt: string;
    updatedAt: string;
}
export interface Promotion {
    id: string;
    nama: string;
    tipe: 'persen' | 'nominal';
    nilai: number;
    minOrder: number;
    tanggalMulai: string;
    tanggalSelesai: string;
    branchId: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface AppSettings {
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    invoiceFooter: string;
    logoBase64: string;
    ppnPercent: number;
    gratuityPercent: number;
    saldoAwalKas: number;
    whatsappEnabled: boolean;
    whatsappProvider: string;
    whatsappApiUrl: string;
    whatsappApiKey: string;
    whatsappSender: string;
}
export interface MessageTemplate {
    id: string;
    type: MessageTemplateType;
    header: string;
    footer: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
interface MembershipBase {
    id: string;
    customerId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface MembershipPeriodik extends MembershipBase {
    tipe: 'periodik';
    durasibulan: 3 | 6 | 12;
    tanggalMulai: string;
    tanggalSelesai: string;
    paketKg: null;
    sisaKg: null;
}
export interface MembershipPaketKg extends MembershipBase {
    tipe: 'paket_kg';
    durasibulan: null;
    tanggalMulai: null;
    tanggalSelesai: null;
    paketKg: number;
    sisaKg: number;
}
export type Membership = MembershipPeriodik | MembershipPaketKg;
export interface Item {
    id: string;
    nama: string;
    tipe: ItemType;
    harga: number;
    isActive: boolean;
    branchId: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface OrderItem {
    id: string;
    orderId: string;
    itemId: string;
    namaItem: string;
    tipe: ItemType;
    harga: number;
    qty: number;
    subtotal: number;
}
export interface OrderStatusHistory {
    id: string;
    orderId: string;
    status: OrderStatus;
    changedBy: string | null;
    changedAt: string;
    catatan: string | null;
}
export interface Order {
    id: string;
    invoiceNo: string;
    customerId: string;
    membershipId: string | null;
    diskonPersen: number;
    subtotal: number;
    diskonAmount: number;
    promoId: string | null;
    promoDiskonAmount: number;
    gratuityAmount: number;
    ppnAmount: number;
    total: number;
    metodePembayaran: OrderPaymentMethod;
    jumlahDibayar: number;
    status: OrderStatus;
    catatan: string | null;
    branchId: string | null;
    pickupToken: string | null;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
    items?: OrderItem[];
    statusHistory?: OrderStatusHistory[];
    customer?: Pick<Customer, 'id' | 'nama' | 'noHp'>;
}
export interface ExpenseCategory {
    id: string;
    nama: string;
    level: ExpenseLevel;
    createdAt: string;
}
export interface Expense {
    id: string;
    tanggal: string;
    jumlah: number;
    categoryId: string;
    deskripsi: string | null;
    inventoryItemId: string | null;
    qtyUsed: number | null;
    branchId: string | null;
    metodePembayaran: ExpensePaymentMethod;
    createdBy: string | null;
    createdAt: string;
    category?: Pick<ExpenseCategory, 'id' | 'nama' | 'level'>;
}
export interface InventoryItem {
    id: string;
    nama: string;
    satuan: string;
    qtySaatIni: number;
    hargaRataFifo: number;
    stokMinimum: number;
    isActive: boolean;
    branchId: string | null;
    createdAt: string;
    updatedAt: string;
    isLowStock?: boolean;
}
export interface InventoryTransaction {
    id: string;
    itemId: string;
    tipe: InventoryTransactionType;
    qty: number;
    hargaPerUnit: number | null;
    referensi: string | null;
    fotoReferensi: string | null;
    createdBy: string | null;
    createdAt: string;
}
export interface Shift {
    id: string;
    kasirId: string;
    branchId: string;
    startTime: string;
    endTime: string | null;
    startCash: number;
    endCash: number | null;
    notes: string | null;
    createdAt: string;
    kasir?: Pick<User, 'id' | 'nama' | 'username'>;
    branch?: Pick<Branch, 'id' | 'nama'>;
}
export interface MembershipValidationResult {
    membership: Membership | null;
    discountPercent: number;
    warning: string | null;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
export type { ExpenseLevel, ExpensePaymentMethod, InventoryTransactionType, ItemType, MembershipType, MessageTemplateType, OrderPaymentMethod, OrderStatus, UserRole, };
//# sourceMappingURL=types.d.ts.map