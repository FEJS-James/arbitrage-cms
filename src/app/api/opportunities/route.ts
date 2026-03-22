export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";
import { generateId, calculateProfit, calculateROI } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    let query = `SELECT ro.*, p.name as product_name, p.source_price
                 FROM resale_opportunities ro
                 JOIN products p ON ro.product_id = p.id`;
    const args: Record<string, string> = {};

    if (productId) {
      query += " WHERE ro.product_id = :product_id";
      args.product_id = productId;
    }

    query += " ORDER BY ro.estimated_roi DESC";
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
    if (!body.product_id || typeof body.product_id !== "string") {
      return NextResponse.json({ error: "product_id is required and must be a string" }, { status: 400 });
    }
    if (!body.platform || typeof body.platform !== "string") {
      return NextResponse.json({ error: "platform is required and must be a string" }, { status: 400 });
    }
    if (body.estimated_sell_price == null || typeof body.estimated_sell_price !== "number") {
      return NextResponse.json({ error: "estimated_sell_price is required and must be a number" }, { status: 400 });
    }

    const id = generateId();

    // Get source price for profit calculation
    const product = await db.execute({
      sql: "SELECT source_price FROM products WHERE id = :id",
      args: { id: body.product_id },
    });

    if (product.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const sourcePrice = product.rows[0].source_price as number;
    const feePercent = body.platform_fee_percent || 0;
    const feeFixed = body.platform_fee_fixed || 0;
    const shippingCost = body.estimated_shipping_cost || 0;

    const estimatedProfit = calculateProfit(
      body.estimated_sell_price,
      sourcePrice,
      feePercent,
      feeFixed,
      shippingCost
    );
    const estimatedRoi = calculateROI(estimatedProfit, sourcePrice);

    await db.execute({
      sql: `INSERT INTO resale_opportunities (id, product_id, platform, listing_url, estimated_sell_price, actual_sell_price, platform_fee_percent, platform_fee_fixed, estimated_shipping_cost, estimated_profit, estimated_roi, status)
            VALUES (:id, :product_id, :platform, :listing_url, :estimated_sell_price, :actual_sell_price, :platform_fee_percent, :platform_fee_fixed, :estimated_shipping_cost, :estimated_profit, :estimated_roi, :status)`,
      args: {
        id,
        product_id: body.product_id,
        platform: body.platform,
        listing_url: body.listing_url || null,
        estimated_sell_price: body.estimated_sell_price,
        actual_sell_price: body.actual_sell_price || null,
        platform_fee_percent: feePercent,
        platform_fee_fixed: feeFixed,
        estimated_shipping_cost: shippingCost,
        estimated_profit: estimatedProfit,
        estimated_roi: estimatedRoi,
        status: body.status || "opportunity",
      },
    });

    return NextResponse.json({ id, estimated_profit: estimatedProfit, estimated_roi: estimatedRoi }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
  }
}
