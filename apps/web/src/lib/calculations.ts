import type { Promotion } from '@laundry-palu/shared';

/** A cart line: any item with a unit price (`harga`) and a quantity. */
export type PricedLine = { item: { harga: number }; qty: number };

/**
 * Sum of all cart lines. Each line is floored individually so the total
 * matches what the API computes server-side (no fractional rupiah).
 */
export function calcSubtotal(cart: PricedLine[]): number {
  return cart.reduce((sum, line) => sum + Math.floor(line.item.harga * line.qty), 0);
}

export type OrderTotals = {
  diskonAmount: number;
  promoDiskonAmount: number;
  total: number;
};

/**
 * Apply the membership discount (a percentage) and an optional promo on top of
 * a subtotal. A `persen` promo is a percentage of the subtotal; any other promo
 * type is a fixed amount, capped at the subtotal so the total never goes below 0
 * from the promo alone. Mirrors the API's order pricing.
 */
export function calcOrderTotals(args: {
  subtotal: number;
  discountPercent: number;
  promo: Promotion | null;
}): OrderTotals {
  const { subtotal, discountPercent, promo } = args;

  const diskonAmount = Math.floor((subtotal * discountPercent) / 100);

  const promoDiskonAmount = promo
    ? promo.tipe === 'persen'
      ? Math.floor((subtotal * promo.nilai) / 100)
      : Math.min(promo.nilai, subtotal)
    : 0;

  return {
    diskonAmount,
    promoDiskonAmount,
    total: subtotal - diskonAmount - promoDiskonAmount,
  };
}
