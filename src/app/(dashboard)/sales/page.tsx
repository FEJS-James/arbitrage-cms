"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils";

type Sale = Record<string, unknown>;

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, fees: 0, shipping: 0, profit: 0 });

  const load = useCallback(async () => {
    const res = await fetch("/api/sales");
    const data: Sale[] = await res.json();
    setSales(data);

    const t = data.reduce<{ revenue: number; fees: number; shipping: number; profit: number }>(
      (acc, s) => ({
        revenue: acc.revenue + (s.sell_price as number),
        fees: acc.fees + (s.platform_fees as number),
        shipping: acc.shipping + (s.shipping_cost as number),
        profit: acc.profit + (s.net_profit as number),
      }),
      { revenue: 0, fees: 0, shipping: 0, profit: 0 }
    );
    setTotals(t);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "product_name", label: "Product", render: (r: Sale) => <span className="font-medium text-white">{r.product_name as string}</span> },
    { key: "platform", label: "Platform" },
    { key: "sell_price", label: "Sell Price", render: (r: Sale) => formatCurrency(r.sell_price as number) },
    { key: "platform_fees", label: "Fees", render: (r: Sale) => <span className="text-red-400">-{formatCurrency(r.platform_fees as number)}</span> },
    { key: "shipping_cost", label: "Shipping", render: (r: Sale) => <span className="text-red-400">-{formatCurrency(r.shipping_cost as number)}</span> },
    {
      key: "net_profit",
      label: "Net Profit",
      render: (r: Sale) => (
        <span className={`font-bold ${(r.net_profit as number) >= 0 ? "text-green-400" : "text-red-400"}`}>
          {formatCurrency(r.net_profit as number)}
        </span>
      ),
    },
    { key: "sale_date", label: "Date", render: (r: Sale) => formatDate(r.sale_date as string) },
    { key: "buyer_username", label: "Buyer" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Sales</h1>
        <p className="text-slate-400 text-sm mt-1">{sales.length} completed sales</p>
      </div>

      {/* Running Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Revenue</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totals.revenue)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Platform Fees</p>
          <p className="text-xl font-bold text-red-400">-{formatCurrency(totals.fees)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Shipping</p>
          <p className="text-xl font-bold text-red-400">-{formatCurrency(totals.shipping)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Net Profit</p>
          <p className={`text-xl font-bold ${totals.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(totals.profit)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={sales}
          emptyMessage="No sales recorded yet."
        />
      )}
    </div>
  );
}
