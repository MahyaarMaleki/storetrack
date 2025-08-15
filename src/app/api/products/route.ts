import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { products, productHistory, productCategories } from "@/db/schema";
import { products as productsSchema } from "@/db/schema";
import { and, eq, gte, like, lte, sql } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

type NewProduct = typeof productsSchema.$inferInsert;

export async function POST(request: NextRequest) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const data: NewProduct = await request.json();

    const validationResult = productSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const [newProduct] = await db
      .insert(products)
      .values(validatedData)
      .returning();

    await db.insert(productHistory).values({
      productId: newProduct.id,
      type: "arrival",
      quantity: newProduct.supply,
    });

    return NextResponse.json(
      { message: "Product added successfully!", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add product. Please check the data." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("name");
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const conditions = [];

    // Filter by search term
    if (searchTerm) {
      conditions.push(
        like(sql`lower(${products.name})`, `%${searchTerm.toLowerCase()}%`)
      );
    }

    // Filter by category
    if (category && productCategories.includes(category as any)) {
      conditions.push(
        eq(products.category, category as (typeof productCategories)[number])
      );
    }

    // Filter by price range
    if (minPrice) {
      conditions.push(gte(products.price, Number(minPrice)));
    }
    if (maxPrice) {
      conditions.push(lte(products.price, Number(maxPrice)));
    }

    // Build the query
    const allProducts = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
    });

    return NextResponse.json(allProducts, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
