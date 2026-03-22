export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;

    const product = await db.execute({
      sql: "SELECT * FROM products WHERE id = :id",
      args: { id },
    });

    if (product.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const opportunities = await db.execute({
      sql: "SELECT * FROM resale_opportunities WHERE product_id = :id ORDER BY estimated_roi DESC",
      args: { id },
    });

    const purchases = await db.execute({
      sql: "SELECT * FROM purchases WHERE product_id = :id ORDER BY purchase_date DESC",
      args: { id },
    });

    // Get listings for all purchases of this product
    const purchaseIds = purchases.rows.map((p) => p.id as string);
    let listings = { rows: [] as typeof purchases.rows };
    if (purchaseIds.length > 0) {
      const placeholders = purchaseIds.map((_, i) => `:p${i}`).join(",");
      const listingArgs: Record<string, string> = {};
      purchaseIds.forEach((pid, i) => {
        listingArgs[`p${i}`] = pid;
      });
      listings = await db.execute({
        sql: `SELECT * FROM listings WHERE purchase_id IN (${placeholders}) ORDER BY listing_date DESC`,
        args: listingArgs,
      });
    }

    return NextResponse.json({
      ...product.rows[0],
      opportunities: opportunities.rows,
      purchases: purchases.rows,
      listings: listings.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const body = await request.json();

    const fields: string[] = [];
    const args: Record<string, string | number | null> = { id };

    const allowedFields = [
      "name", "description", "image_url", "category", "upc", "asin",
      "source_platform", "source_url", "source_price", "source_condition",
      "expires_at", "status", "notes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = :${field}`);
        args[field] = body[field] as string | number | null;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await db.execute({
      sql: `UPDATE products SET ${fields.join(", ")} WHERE id = :id`,
      args,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
