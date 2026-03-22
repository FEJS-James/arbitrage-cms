export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();

    const [statusCounts, totalProfit, totalSpent, topOpportunities, recentProducts, recentSales] =
      await Promise.all([
        db.execute({
          sql: `SELECT status, COUNT(*) as count FROM products GROUP BY status`,
          args: {},
        }),
        db.execute({
          sql: `SELECT COALESCE(SUM(net_profit), 0) as total FROM sales`,
          args: {},
        }),
        db.execute({
          sql: `SELECT COALESCE(SUM(total_cost), 0) as total FROM purchases`,
          args: {},
        }),
        db.execute({
          sql: `SELECT ro.*, p.name as product_name, p.source_price
                FROM resale_opportunities ro
                JOIN products p ON ro.product_id = p.id
                WHERE ro.status = 'opportunity'
                ORDER BY ro.estimated_roi DESC
                LIMIT 10`,
          args: {},
        }),
        db.execute({
          sql: `SELECT * FROM products ORDER BY discovered_at DESC LIMIT 10`,
          args: {},
        }),
        db.execute({
          sql: `SELECT s.*, p.name as product_name
                FROM sales s
                JOIN purchases pu ON s.purchase_id = pu.id
                JOIN products p ON pu.product_id = p.id
                ORDER BY s.sale_date DESC
                LIMIT 10`,
          args: {},
        }),
      ]);

    const counts: Record<string, number> = {};
    statusCounts.rows.forEach((row) => {
      counts[row.status as string] = row.count as number;
    });

    const totalSalesRevenue = await db.execute({
      sql: `SELECT COALESCE(SUM(sell_price), 0) as total FROM sales`,
      args: {},
    });

    return NextResponse.json({
      counts: {
        discovered: counts.discovered || 0,
        watching: counts.watching || 0,
        bought: counts.bought || 0,
        listed: counts.listed || 0,
        sold: counts.sold || 0,
        passed: counts.passed || 0,
        expired: counts.expired || 0,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      },
      financials: {
        total_profit: totalProfit.rows[0]?.total || 0,
        total_spent: totalSpent.rows[0]?.total || 0,
        total_revenue: totalSalesRevenue.rows[0]?.total || 0,
      },
      top_opportunities: topOpportunities.rows,
      recent_products: recentProducts.rows,
      recent_sales: recentSales.rows,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
