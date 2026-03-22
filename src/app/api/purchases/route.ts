export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const received = searchParams.get("received");

    let query = `SELECT pu.*, p.name as product_name, p.image_url, p.source_price
                 FROM purchases pu
                 JOIN products p ON pu.product_id = p.id`;
    const args: Record<string, string> = {};

    if (received !== null) {
      query += " WHERE pu.received = :received";
      args.received = received;
    }

    query += " ORDER BY pu.purchase_date DESC";
    const result = await db.execute({ sql: query, args });
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch purchases:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await request.json();

    // Input validation
    if (!body.product_id || typeof body.product_id !== "string") {
      return NextResponse.json({ error: "product_id is required and must be a string" }, { status: 400 });
    }
    if (body.total_cost == null || typeof body.total_cost !== "number") {
      return NextResponse.json({ error: "total_cost is required and must be a number" }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO purchases (id, product_id, quantity, total_cost, purchase_date, order_id, tracking_number, received, received_date, condition_notes, storage_location)
            VALUES (:id, :product_id, :quantity, :total_cost, :purchase_date, :order_id, :tracking_number, :received, :received_date, :condition_notes, :storage_location)`,
      args: {
        id,
        product_id: body.product_id,
        quantity: body.quantity || 1,
        total_cost: body.total_cost,
        purchase_date: body.purchase_date || now,
        order_id: body.order_id || null,
        tracking_number: body.tracking_number || null,
        received: body.received || 0,
        received_date: body.received_date || null,
        condition_notes: body.condition_notes || null,
        storage_location: body.storage_location || null,
      },
    });

    // Update product status to 'bought'
    await db.execute({
      sql: "UPDATE products SET status = 'bought' WHERE id = :id AND status IN ('discovered', 'watching')",
      args: { id: body.product_id },
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
