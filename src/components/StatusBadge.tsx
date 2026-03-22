import { statusColors, type ProductStatus } from "@/lib/utils";

export default function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColors[status as ProductStatus] || "bg-slate-500/20 text-slate-400";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}
