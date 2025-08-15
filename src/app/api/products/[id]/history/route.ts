import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";
import { productHistory } from "@/db/schema";

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

    const history = await db.query.productHistory.findMany({
      where: eq(productHistory.productId, productId),
      with: {
        product: true,
      },
    });

    if (history.length === 0) {
      return NextResponse.json(
        { message: "No history found for this product." },
        { status: 404 }
      );
    }

    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product history." },
      { status: 500 }
    );
  }
}
