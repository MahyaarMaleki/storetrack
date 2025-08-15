import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { products, productHistory } from "@/db/schema";
import { products as productsSchema } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";
import { productSchema } from "@/lib/validations";

type NewProduct = typeof productsSchema.$inferInsert;

export async function POST(request: Request) {
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

export async function GET(request: Request) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const allProducts = await db
      .select()
      .from(products)
      .where(isNull(products.deletedAt))
      .execute();

    return NextResponse.json(allProducts, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 }
    );
  }
}
