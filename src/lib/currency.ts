export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatBtc(amount: number): string {
  return `${amount.toFixed(8)} BTC`;
}

export function formatUsdt(amount: number): string {
  return `${amount.toFixed(2)} USDT`;
}
