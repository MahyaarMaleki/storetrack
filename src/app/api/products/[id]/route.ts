import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { sql, eq, isNull, and } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const productId = Number(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    const product = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), isNull(products.deletedAt)))
      .limit(1)
      .execute();

    if (product.length === 0) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(product[0], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const productId = Number(params.id);

    // Get partial object to update any field
    const body: Partial<typeof products.$inferInsert> = await request.json();

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Request body cannot be empty." },
        { status: 400 }
      );
    }

    const updatedProduct = await db
      .update(products)
      .set({
        ...body,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(products.id, productId), isNull(products.deletedAt)))
      .returning();

    if (updatedProduct.length === 0) {
      return NextResponse.json(
        { error: "Product not found or already deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Product updated successfully.", product: updatedProduct[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const productId = Number(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    // Perform a soft delete by setting the deleted_at timestamp
    const updatedProducts = await db
      .update(products)
      .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(products.id, productId))
      .returning();

    if (updatedProducts.length === 0) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Product deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}
