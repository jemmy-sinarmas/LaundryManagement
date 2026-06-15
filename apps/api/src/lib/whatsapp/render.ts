import type {
  AppSettings,
  Branch,
  Customer,
  MessageTemplate,
  Order,
  OrderItem,
  OrderPaymentMethod,
} from '@laundry-palu/shared';

export interface ReceiptContext {
  order: Order; // expected to include `items`
  customer: Customer;
  branch: Branch | null;
  settings: AppSettings;
  creatorName?: string;
}

const PAYMENT_METHOD_LABELS: Record<OrderPaymentMethod, string> = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer_bca: 'Transfer BCA',
};

/** Format a number as Indonesian thousands (e.g. 55000 -> "55.000"). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
}

/** Format as Rupiah (e.g. 44000 -> "Rp 44.000"). */
export function formatRp(n: number): string {
  return `Rp ${formatNumber(n)}`;
}

/** Kiloan items are weighed (e.g. "5,0 Kg"); others are counted (e.g. "1 Pcs"). */
function formatQty(item: OrderItem): string {
  if (item.tipe === 'kiloan') {
    const qty = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(item.qty);
    return `${qty} Kg`;
  }
  return `${new Intl.NumberFormat('id-ID').format(item.qty)} Pcs`;
}

/** Receipt date, e.g. "Minggu, 14 Jun 2026". */
export function formatReceiptDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Normalize to a WhatsApp number: digits only, no leading zero on the local part. */
export function normalizePhone(countryCode: string, noHp: string): string {
  const cc = countryCode.replace(/\D/g, '');
  const local = noHp.replace(/\D/g, '').replace(/^0+/, '');
  return `${cc}${local}`;
}

/** Human-readable phone for the receipt body, e.g. "+6281703798952". */
function displayPhone(countryCode: string, noHp: string): string {
  return `+${normalizePhone(countryCode, noHp)}`;
}

/** Substitute {placeholders} in admin-editable header/footer text. */
export function substitutePlaceholders(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? vars[key]! : match
  );
}

function buildVars(ctx: ReceiptContext): Record<string, string> {
  const { order, customer, settings } = ctx;
  return {
    business_name: settings.businessName,
    business_address: settings.businessAddress,
    business_phone: settings.businessPhone,
    customer_name: customer.nama,
    invoice_no: order.invoiceNo,
    total: formatRp(order.total),
  };
}

/** Total discount applied to the order (membership % + manual + promo). */
function totalDiscount(order: Order): number {
  return order.diskonAmount + order.promoDiskonAmount;
}

/** Renders the detailed payment receipt: editable header + fixed body + editable footer. */
export function renderPaymentReceipt(template: MessageTemplate, ctx: ReceiptContext): string {
  const { order, customer, creatorName } = ctx;
  const vars = buildVars(ctx);
  const items = order.items ?? [];
  const discount = totalDiscount(order);

  const lines: string[] = [];
  lines.push(substitutePlaceholders(template.header, vars));
  lines.push('');
  lines.push(`Invoice #${order.invoiceNo}`);
  lines.push(formatReceiptDate(order.createdAt));
  if (creatorName) lines.push(`Dibuat oleh: ${creatorName}`);
  lines.push('');
  lines.push('Pelanggan');
  lines.push(customer.nama);
  lines.push(displayPhone(customer.countryCode, customer.noHp));
  if (customer.alamat) lines.push(customer.alamat);
  lines.push('');
  lines.push('Metode Pembayaran');
  lines.push(PAYMENT_METHOD_LABELS[order.metodePembayaran] ?? order.metodePembayaran);
  lines.push('');
  lines.push(`Order No: ${order.invoiceNo}`);
  for (const item of items) {
    lines.push(`- ${item.namaItem}: ${formatQty(item)} - ${formatNumber(item.subtotal)}`);
  }
  if (discount > 0) {
    const label = order.diskonPersen > 0 ? `Diskon ${order.diskonPersen}%` : 'Diskon';
    lines.push(`${label} - (${formatNumber(discount)})`);
  }
  lines.push(`Total Order: ${formatRp(order.total)}`);
  lines.push('');
  lines.push('========================');
  lines.push(`Total Invoice: ${formatRp(order.total)}`);
  lines.push('');
  lines.push(substitutePlaceholders(template.footer, vars));

  return lines.join('\n');
}

/** Renders the short "ready for collection" notice. */
export function renderReadyForCollection(template: MessageTemplate, ctx: ReceiptContext): string {
  const { order, customer } = ctx;
  const vars = buildVars(ctx);

  const lines: string[] = [];
  lines.push(substitutePlaceholders(template.header, vars));
  lines.push('');
  lines.push(`Halo ${customer.nama},`);
  lines.push(`Pesanan Anda dengan invoice #${order.invoiceNo} sudah SIAP DIAMBIL. 🎉`);
  lines.push('');
  lines.push(`Total: ${formatRp(order.total)}`);
  lines.push('');
  lines.push(substitutePlaceholders(template.footer, vars));

  return lines.join('\n');
}
