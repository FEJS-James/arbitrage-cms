export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET() {
  try {
    await initDb();
    const result = await db.execute({
      sql: `SELECT s.*, l.platform, l.listing_price, p.name as product_name, p.source_price, pu.total_cost
            FROM sales s
            JOIN listings l ON s.listing_id = l.id
            JOIN purchases pu ON s.purchase_id = pu.id
            JOIN products p ON pu.product_id = p.id
            ORDER BY s.sale_date DESC`,
      args: {},
    });
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await request.json();

    // Input validation
    if (!body.listing_id || typeof body.listing_id !== "string") {
      return NextResponse.json({ error: "listing_id is required and must be a string" }, { status: 400 });
    }
    if (!body.purchase_id || typeof body.purchase_id !== "string") {
      return NextResponse.json({ error: "purchase_id is required and must be a string" }, { status: 400 });
    }
    if (body.sell_price == null || typeof body.sell_price !== "number") {
      return NextResponse.json({ error: "sell_price is required and must be a number" }, { status: 400 });
    }
    if (body.platform_fees == null || typeof body.platform_fees !== "number") {
      return NextResponse.json({ error: "platform_fees is required and must be a number" }, { status: 400 });
    }
    if (body.shipping_cost == null || typeof body.shipping_cost !== "number") {
      return NextResponse.json({ error: "shipping_cost is required and must be a number" }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();

    const netProfit = body.sell_price - body.platform_fees - body.shipping_cost;

    // Get the purchase cost to compute true profit
    let trueProfitFromCost = netProfit;
    if (body.purchase_id) {
      const purchase = await db.execute({
        sql: "SELECT total_cost FROM purchases WHERE id = :id",
        args: { id: body.purchase_id },
      });
      if (purchase.rows.length > 0) {
        trueProfitFromCost = netProfit - (purchase.rows[0].total_cost as number);
      }
    }

    await db.execute({
      sql: `INSERT INTO sales (id, listing_id, purchase_id, sell_price, platform_fees, shipping_cost, net_profit, sale_date, buyer_username, notes)
            VALUES (:id, :listing_id, :purchase_id, :sell_price, :platform_fees, :shipping_cost, :net_profit, :sale_date, :buyer_username, :notes)`,
      args: {
        id,
        listing_id: body.listing_id,
        purchase_id: body.purchase_id,
        sell_price: body.sell_price,
        platform_fees: body.platform_fees,
        shipping_cost: body.shipping_cost,
        net_profit: trueProfitFromCost,
        sale_date: body.sale_date || now,
        buyer_username: body.buyer_username || null,
        notes: body.notes || null,
      },
    });

    // Update listing status to sold
    await db.execute({
      sql: "UPDATE listings SET status = 'sold' WHERE id = :id",
      args: { id: body.listing_id },
    });

    // Update product status to sold
    if (body.purchase_id) {
      const purchase = await db.execute({
        sql: "SELECT product_id FROM purchases WHERE id = :id",
        args: { id: body.purchase_id },
      });
      if (purchase.rows.length > 0) {
        await db.execute({
          sql: "UPDATE products SET status = 'sold' WHERE id = :id",
          args: { id: purchase.rows[0].product_id as string },
        });
      }
    }

    return NextResponse.json({ id, net_profit: trueProfitFromCost }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
