"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ProductDetail {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  upc: string | null;
  asin: string | null;
  source_platform: string | null;
  source_url: string | null;
  source_price: number;
  source_condition: string | null;
  discovered_at: string;
  expires_at: string | null;
  status: string;
  notes: string | null;
  opportunities: Array<Record<string, unknown>>;
  purchases: Array<Record<string, unknown>>;
  listings: Array<Record<string, unknown>>;
}

const allStatuses = ["discovered", "watching", "bought", "listed", "sold", "passed", "expired"];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showOpportunity, setShowOpportunity] = useState(false);

  const [purchaseForm, setPurchaseForm] = useState({ total_cost: "", order_id: "", tracking_number: "", storage_location: "", condition_notes: "" });
  const [oppForm, setOppForm] = useState({ platform: "", estimated_sell_price: "", platform_fee_percent: "", platform_fee_fixed: "", estimated_shipping_cost: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/products/${params.id}`);
    if (!res.ok) { router.push("/products"); return; }
    setProduct(await res.json());
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/products/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const addPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: params.id,
        total_cost: parseFloat(purchaseForm.total_cost),
        order_id: purchaseForm.order_id || undefined,
        tracking_number: purchaseForm.tracking_number || undefined,
        storage_location: purchaseForm.storage_location || undefined,
        condition_notes: purchaseForm.condition_notes || undefined,
      }),
    });
    setShowPurchase(false);
    setPurchaseForm({ total_cost: "", order_id: "", tracking_number: "", storage_location: "", condition_notes: "" });
    load();
  };

  const addOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: params.id,
        platform: oppForm.platform,
        estimated_sell_price: parseFloat(oppForm.estimated_sell_price),
        platform_fee_percent: parseFloat(oppForm.platform_fee_percent) || 0,
        platform_fee_fixed: parseFloat(oppForm.platform_fee_fixed) || 0,
        estimated_shipping_cost: parseFloat(oppForm.estimated_shipping_cost) || 0,
      }),
    });
    setShowOpportunity(false);
    setOppForm({ platform: "", estimated_sell_price: "", platform_fee_percent: "", platform_fee_fixed: "", estimated_shipping_cost: "" });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-slate-400">Loading...</p></div>;
  if (!product) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push("/products")} className="text-sm text-slate-400 hover:text-white mb-2 inline-block">
            ← Back to Products
          </button>
          <h1 className="text-2xl font-bold text-white">{product.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={product.status} />
            <span className="text-slate-400 text-sm">{product.source_platform || "Unknown source"}</span>
            <span className="text-xl font-bold text-white">{formatCurrency(product.source_price)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowOpportunity(true)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sm text-white rounded-lg transition-colors">
            + Opportunity
          </button>
          <button onClick={() => setShowPurchase(true)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-sm text-white rounded-lg transition-colors">
            + Purchase
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Product Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">Category:</span> <span className="text-white ml-2">{product.category || "—"}</span></div>
            <div><span className="text-slate-400">Condition:</span> <span className="text-white ml-2">{product.source_condition || "—"}</span></div>
            <div><span className="text-slate-400">UPC:</span> <span className="text-white ml-2">{product.upc || "—"}</span></div>
            <div><span className="text-slate-400">ASIN:</span> <span className="text-white ml-2">{product.asin || "—"}</span></div>
            <div><span className="text-slate-400">Discovered:</span> <span className="text-white ml-2">{formatDate(product.discovered_at)}</span></div>
            <div><span className="text-slate-400">Expires:</span> <span className="text-white ml-2">{formatDate(product.expires_at)}</span></div>
          </div>
          {product.source_url && (
            <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
              View Source Listing →
            </a>
          )}
          {product.description && <p className="text-slate-400 text-sm">{product.description}</p>}
          {product.notes && <p className="text-sm text-yellow-400/70 italic">Note: {product.notes}</p>}
        </div>

        {/* Status Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {allStatuses.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={product.status === s}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  product.status === s
                    ? "bg-blue-600 text-white cursor-default"
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resale Opportunities */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">💡 Resale Opportunities</h2>
        {product.opportunities.length === 0 ? (
          <p className="text-slate-400 text-sm">No opportunities added yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Platform</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Sell Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Fees</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Shipping</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Est. Profit</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {product.opportunities.map((opp) => (
                  <tr key={opp.id as string}>
                    <td className="px-4 py-3 text-sm text-white">{opp.platform as string}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatCurrency(opp.estimated_sell_price as number)}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{opp.platform_fee_percent as number}% + {formatCurrency(opp.platform_fee_fixed as number)}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{formatCurrency(opp.estimated_shipping_cost as number)}</td>
                    <td className={`px-4 py-3 text-sm font-bold ${(opp.estimated_profit as number) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatCurrency(opp.estimated_profit as number)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold ${(opp.estimated_roi as number) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {(opp.estimated_roi as number).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchase History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">🛒 Purchase History</h2>
        {product.purchases.length === 0 ? (
          <p className="text-slate-400 text-sm">No purchases recorded</p>
        ) : (
          <div className="space-y-3">
            {product.purchases.map((p) => (
              <div key={p.id as string} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-white font-medium">{formatCurrency(p.total_cost as number)} × {p.quantity as number}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(p.purchase_date as string)} · Order: {(p.order_id as string) || "—"} · Tracking: {(p.tracking_number as string) || "—"}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${p.received ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {p.received ? "Received" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Listing History */}
      {product.listings.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">📋 Listings</h2>
          <div className="space-y-3">
            {product.listings.map((l) => (
              <div key={l.id as string} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="text-sm text-white font-medium">{l.platform as string} — {formatCurrency(l.listing_price as number)}</p>
                  <p className="text-xs text-slate-400">
                    Listed {formatDate(l.listing_date as string)} · {l.views as number} views · {l.watchers as number} watchers
                  </p>
                </div>
                <StatusBadge status={l.status as string} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      <Modal isOpen={showPurchase} onClose={() => setShowPurchase(false)} title="Record Purchase">
        <form onSubmit={addPurchase} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Total Cost *</label>
            <input type="number" step="0.01" required value={purchaseForm.total_cost} onChange={(e) => setPurchaseForm({ ...purchaseForm, total_cost: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Order ID</label>
              <input type="text" value={purchaseForm.order_id} onChange={(e) => setPurchaseForm({ ...purchaseForm, order_id: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tracking #</label>
              <input type="text" value={purchaseForm.tracking_number} onChange={(e) => setPurchaseForm({ ...purchaseForm, tracking_number: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Storage Location</label>
            <input type="text" value={purchaseForm.storage_location} onChange={(e) => setPurchaseForm({ ...purchaseForm, storage_location: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Condition Notes</label>
            <textarea rows={2} value={purchaseForm.condition_notes} onChange={(e) => setPurchaseForm({ ...purchaseForm, condition_notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowPurchase(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">Record Purchase</button>
          </div>
        </form>
      </Modal>

      {/* Add Opportunity Modal */}
      <Modal isOpen={showOpportunity} onClose={() => setShowOpportunity(false)} title="Add Resale Opportunity">
        <form onSubmit={addOpportunity} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Platform *</label>
            <input type="text" required value={oppForm.platform} onChange={(e) => setOppForm({ ...oppForm, platform: e.target.value })} placeholder="e.g. eBay, Amazon, Mercari" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Estimated Sell Price *</label>
            <input type="number" step="0.01" required value={oppForm.estimated_sell_price} onChange={(e) => setOppForm({ ...oppForm, estimated_sell_price: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fee % (e.g. 13)</label>
              <input type="number" step="0.1" value={oppForm.platform_fee_percent} onChange={(e) => setOppForm({ ...oppForm, platform_fee_percent: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fixed Fee ($)</label>
              <input type="number" step="0.01" value={oppForm.platform_fee_fixed} onChange={(e) => setOppForm({ ...oppForm, platform_fee_fixed: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Est. Shipping Cost</label>
            <input type="number" step="0.01" value={oppForm.estimated_shipping_cost} onChange={(e) => setOppForm({ ...oppForm, estimated_shipping_cost: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowOpportunity(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">Add Opportunity</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
