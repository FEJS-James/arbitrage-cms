export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const platform = searchParams.get("source_platform");
    const sort = searchParams.get("sort") || "discovered_at";
    const order = searchParams.get("order") || "DESC";

    let query = "SELECT * FROM products WHERE 1=1";
    const args: Record<string, string> = {};

    if (status) {
      query += " AND status = :status";
      args.status = status;
    }
    if (category) {
      query += " AND category = :category";
      args.category = category;
    }
    if (platform) {
      query += " AND source_platform = :platform";
      args.platform = platform;
    }

    const allowedSorts = ["discovered_at", "source_price", "name", "status"];
    const safeSort = allowedSorts.includes(sort) ? sort : "discovered_at";
    const safeOrder = order === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY ${safeSort} ${safeOrder}`;

    const result = await db.execute({ sql: query, args });
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const body = await request.json();

    // Input validation
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "name is required and must be a string" }, { status: 400 });
    }
    if (body.source_price == null || typeof body.source_price !== "number") {
      return NextResponse.json({ error: "source_price is required and must be a number" }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO products (id, name, description, image_url, category, upc, asin, source_platform, source_url, source_price, source_condition, discovered_at, expires_at, status, notes)
            VALUES (:id, :name, :description, :image_url, :category, :upc, :asin, :source_platform, :source_url, :source_price, :source_condition, :discovered_at, :expires_at, :status, :notes)`,
      args: {
        id,
        name: body.name,
        description: body.description || null,
        image_url: body.image_url || null,
        category: body.category || null,
        upc: body.upc || null,
        asin: body.asin || null,
        source_platform: body.source_platform || null,
        source_url: body.source_url || null,
        source_price: body.source_price,
        source_condition: body.source_condition || null,
        discovered_at: body.discovered_at || now,
        expires_at: body.expires_at || null,
        status: body.status || "discovered",
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
