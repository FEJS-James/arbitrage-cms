export function generateId(): string {
  return crypto.randomUUID();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function calculateProfit(
  sellPrice: number,
  sourceCost: number,
  feePercent: number,
  feeFixed: number,
  shippingCost: number
): number {
  const fees = sellPrice * (feePercent / 100) + feeFixed;
  return sellPrice - sourceCost - fees - shippingCost;
}

export function calculateROI(profit: number, cost: number): number {
  if (cost === 0) return 0;
  return (profit / cost) * 100;
}

export type ProductStatus =
  | "discovered"
  | "watching"
  | "bought"
  | "listed"
  | "sold"
  | "passed"
  | "expired";

export const statusColors: Record<ProductStatus, string> = {
  discovered: "bg-purple-500/20 text-purple-400",
  watching: "bg-yellow-500/20 text-yellow-400",
  bought: "bg-blue-500/20 text-blue-400",
  listed: "bg-cyan-500/20 text-cyan-400",
  sold: "bg-green-500/20 text-green-400",
  passed: "bg-slate-500/20 text-slate-400",
  expired: "bg-red-500/20 text-red-400",
};
