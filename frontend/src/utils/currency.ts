const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return inrFormatter.format(0);
  }
  return inrFormatter.format(amount);
}
