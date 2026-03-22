export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = `SELECT l.*, p.name as product_name, p.image_url, p.source_price, pu.total_cost
                 FROM listings l
                 JOIN purchases pu ON l.purchase_id = pu.id
                 JOIN products p ON pu.product_id = p.id`;
    const args: Record<string, string> = {};

    if (status) {
      query += " WHERE l.status = :status";
      args.status = status;
    }

    query += " ORDER BY l.listing_date DESC";
    const result = await db.execute({ sql: query, args });
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
    if (!body.purchase_id || typeof body.purchase_id !== "string") {
      return NextResponse.json({ error: "purchase_id is required and must be a string" }, { status: 400 });
    }
    if (!body.platform || typeof body.platform !== "string") {
      return NextResponse.json({ error: "platform is required and must be a string" }, { status: 400 });
    }
    if (body.listing_price == null || typeof body.listing_price !== "number") {
      return NextResponse.json({ error: "listing_price is required and must be a number" }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO listings (id, purchase_id, platform, listing_url, listing_price, listing_date, status, views, watchers)
            VALUES (:id, :purchase_id, :platform, :listing_url, :listing_price, :listing_date, :status, :views, :watchers)`,
      args: {
        id,
        purchase_id: body.purchase_id,
        platform: body.platform,
        listing_url: body.listing_url || null,
        listing_price: body.listing_price,
        listing_date: body.listing_date || now,
        status: body.status || "active",
        views: body.views || 0,
        watchers: body.watchers || 0,
      },
    });

    // Update product status to 'listed'
    const purchase = await db.execute({
      sql: "SELECT product_id FROM purchases WHERE id = :id",
      args: { id: body.purchase_id },
    });
    if (purchase.rows.length > 0) {
      await db.execute({
        sql: "UPDATE products SET status = 'listed' WHERE id = :id",
        args: { id: purchase.rows[0].product_id as string },
      });
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
