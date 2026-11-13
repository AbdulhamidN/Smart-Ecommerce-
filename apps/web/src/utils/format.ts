export function formatMoney(cents: number): string {
  const formatted = (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `ETB ${formatted}`;
}
