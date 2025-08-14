import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { products, productHistory } from "@/db/schema";
import { products as productsSchema } from "@/db/schema";

type NewProduct = typeof productsSchema.$inferInsert;

export async function POST(request: Request) {
  try {
    const data: NewProduct = await request.json();

    const [newProduct] = await db.insert(products).values(data).returning();

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

export async function GET() {
  try {
    const allProducts = await db.select().from(products).execute();

    return NextResponse.json(allProducts, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
