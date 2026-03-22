"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

type Listing = Record<string, unknown>;

const listingStatuses = ["all", "active", "sold", "ended", "cancelled"];

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    const res = await fetch(`/api/listings?${params}`);
    setListings(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "product_name", label: "Product", render: (r: Listing) => <span className="font-medium text-white">{r.product_name as string}</span> },
    { key: "platform", label: "Platform" },
    { key: "listing_price", label: "Price", render: (r: Listing) => formatCurrency(r.listing_price as number) },
    { key: "source_price", label: "Source Price", render: (r: Listing) => formatCurrency(r.source_price as number) },
    {
      key: "margin",
      label: "Margin",
      render: (r: Listing) => {
        const margin = (r.listing_price as number) - (r.source_price as number);
        return <span className={margin >= 0 ? "text-green-400" : "text-red-400"}>{formatCurrency(margin)}</span>;
      },
    },
    { key: "views", label: "Views" },
    { key: "watchers", label: "Watchers" },
    { key: "listing_date", label: "Listed", render: (r: Listing) => formatDate(r.listing_date as string) },
    { key: "status", label: "Status", render: (r: Listing) => <StatusBadge status={r.status as string} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Listings</h1>
        <p className="text-slate-400 text-sm mt-1">{listings.length} listings</p>
      </div>

      <div className="flex gap-2">
        {listingStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
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
          data={listings}
          emptyMessage="No listings yet. Create listings from the product detail page."
        />
      )}
    </div>
  );
}
