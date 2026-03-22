"use client";

import { useEffect, useState, useCallback } from "react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardData {
  counts: Record<string, number>;
  financials: { total_profit: number; total_spent: number; total_revenue: number };
  top_opportunities: Array<Record<string, unknown>>;
  recent_products: Array<Record<string, unknown>>;
  recent_sales: Array<Record<string, unknown>>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // Initialize DB first
      await fetch("/api/init", { method: "POST" });
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      setData(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-slate-400">Loading...</p></div>;
  if (error) return <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">{error}</div>;
  if (!data) return null;

  const roi = data.financials.total_spent > 0
    ? ((data.financials.total_profit / data.financials.total_spent) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Arbitrage pipeline overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard icon="🔍" label="Discovered" value={data.counts.discovered} />
        <StatCard icon="👀" label="Watching" value={data.counts.watching} />
        <StatCard icon="🛒" label="Bought" value={data.counts.bought} />
        <StatCard icon="📋" label="Listed" value={data.counts.listed} />
        <StatCard icon="💰" label="Sold" value={data.counts.sold} />
        <StatCard icon="⏭️" label="Passed" value={data.counts.passed} />
        <StatCard icon="📦" label="Total" value={data.counts.total} />
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon="💵" label="Total Revenue" value={formatCurrency(data.financials.total_revenue)} />
        <StatCard icon="🏷️" label="Total Spent" value={formatCurrency(data.financials.total_spent)} />
        <StatCard
          icon="📈"
          label="Net Profit"
          value={formatCurrency(data.financials.total_profit)}
          trend={data.financials.total_profit >= 0 ? "up" : "down"}
        />
        <StatCard icon="🎯" label="ROI" value={`${roi}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Opportunities */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">🏆 Top Opportunities by ROI</h2>
          {data.top_opportunities.length === 0 ? (
            <p className="text-slate-400 text-sm">No opportunities yet</p>
          ) : (
            <div className="space-y-3">
              {data.top_opportunities.map((opp) => (
                <div key={opp.id as string} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{opp.product_name as string}</p>
                    <p className="text-xs text-slate-400">{opp.platform as string} · Source: {formatCurrency(opp.source_price as number)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">{formatCurrency(opp.estimated_profit as number)}</p>
                    <p className="text-xs text-slate-400">{(opp.estimated_roi as number).toFixed(1)}% ROI</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">🕐 Recent Products</h2>
          {data.recent_products.length === 0 ? (
            <p className="text-slate-400 text-sm">No products yet</p>
          ) : (
            <div className="space-y-3">
              {data.recent_products.map((product) => (
                <div key={product.id as string} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{product.name as string}</p>
                    <p className="text-xs text-slate-400">
                      {product.source_platform as string || "Unknown"} · {formatDate(product.discovered_at as string)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{formatCurrency(product.source_price as number)}</span>
                    <StatusBadge status={product.status as string} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      {data.recent_sales.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">💰 Recent Sales</h2>
          <div className="space-y-3">
            {data.recent_sales.map((sale) => (
              <div key={sale.id as string} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">{sale.product_name as string}</p>
                  <p className="text-xs text-slate-400">{formatDate(sale.sale_date as string)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatCurrency(sale.sell_price as number)}</p>
                  <p className={`text-xs font-bold ${(sale.net_profit as number) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(sale.net_profit as number)} profit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
