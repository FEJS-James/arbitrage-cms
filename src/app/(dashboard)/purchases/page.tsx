"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils";

type Purchase = Record<string, unknown>;

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "received">("all");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter === "pending") params.set("received", "0");
    if (filter === "received") params.set("received", "1");
    const res = await fetch(`/api/purchases?${params}`);
    setPurchases(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "product_name", label: "Product", render: (r: Purchase) => <span className="font-medium text-white">{r.product_name as string}</span> },
    { key: "total_cost", label: "Cost", render: (r: Purchase) => formatCurrency(r.total_cost as number) },
    { key: "quantity", label: "Qty" },
    { key: "order_id", label: "Order ID" },
    { key: "tracking_number", label: "Tracking" },
    { key: "purchase_date", label: "Date", render: (r: Purchase) => formatDate(r.purchase_date as string) },
    {
      key: "received",
      label: "Status",
      render: (r: Purchase) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          r.received ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
        }`}>
          {r.received ? "Received" : "Pending"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Purchases</h1>
        <p className="text-slate-400 text-sm mt-1">{purchases.length} purchases</p>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "received"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={purchases}
          onRowClick={(row) => router.push(`/products/${row.product_id}`)}
          emptyMessage="No purchases recorded yet."
        />
      )}
    </div>
  );
}
