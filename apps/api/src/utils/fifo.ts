export function calculateFifoAverage(
  currentQty: number,
  currentAvg: number,
  inQty: number,
  inPrice: number
): number {
  const totalQty = currentQty + inQty;
  if (totalQty === 0) return 0;
  return Math.floor((currentQty * currentAvg + inQty * inPrice) / totalQty);
}
