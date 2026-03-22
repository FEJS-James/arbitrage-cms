"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

type Product = Record<string, unknown>;

const statuses = ["all", "discovered", "watching", "bought", "listed", "sold", "passed", "expired"];

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    source_price: "",
    source_platform: "",
    source_url: "",
    category: "",
    source_condition: "",
    upc: "",
    asin: "",
    description: "",
    notes: "",
  });

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    const res = await fetch(`/api/products?${params}`);
    setProducts(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        source_price: parseFloat(form.source_price),
      }),
    });
    setShowAdd(false);
    setForm({ name: "", source_price: "", source_platform: "", source_url: "", category: "", source_condition: "", upc: "", asin: "", description: "", notes: "" });
    load();
  };

  const columns = [
    { key: "name", label: "Product", render: (r: Product) => <span className="font-medium text-white">{r.name as string}</span> },
    { key: "source_platform", label: "Source" },
    { key: "source_price", label: "Price", render: (r: Product) => formatCurrency(r.source_price as number) },
    { key: "category", label: "Category" },
    { key: "status", label: "Status", render: (r: Product) => <StatusBadge status={r.status as string} /> },
    { key: "discovered_at", label: "Discovered", render: (r: Product) => formatDate(r.discovered_at as string) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-slate-400 text-sm mt-1">{products.length} products found</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          onRowClick={(row) => router.push(`/products/${row.id}`)}
          emptyMessage="No products found. Add your first product to get started."
        />
      )}

      {/* Add Product Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Product">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Source Price *</label>
              <input type="number" step="0.01" required value={form.source_price} onChange={(e) => setForm({ ...form, source_price: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Source Platform</label>
              <input type="text" value={form.source_platform} onChange={(e) => setForm({ ...form, source_platform: e.target.value })} placeholder="e.g. Amazon, eBay" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Source URL</label>
            <input type="url" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
              <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Condition</label>
              <input type="text" value={form.source_condition} onChange={(e) => setForm({ ...form, source_condition: e.target.value })} placeholder="e.g. New, Like New" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">UPC</label>
              <input type="text" value={form.upc} onChange={(e) => setForm({ ...form, upc: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">ASIN</label>
              <input type="text" value={form.asin} onChange={(e) => setForm({ ...form, asin: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              Add Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
