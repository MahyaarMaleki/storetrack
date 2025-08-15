import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { products, orders, orderItems, productHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "@/lib/auth";
import { orderSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const authResponse = await verifyAuth(request);
  if (authResponse instanceof NextResponse) {
    return authResponse;
  }

  try {
    const data = await request.json();

    const validationResult = orderSchema.safeParse(data);
    if (!validationResult.success) {
      const formattedErrors = validationResult.error.issues.map((issue) => {
        const field = issue.path.join(".");
        return `${field} is invalid: ${issue.message}`;
      });
      return NextResponse.json({ errors: formattedErrors }, { status: 400 });
    }

    const { items } = validationResult.data;
    let totalPrice = 0;

    // Create a new order record
    const [newOrder] = await db.insert(orders).values({}).returning();

    for (const item of items) {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (product.length === 0) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found.` },
          { status: 404 }
        );
      }

      const productPrice = product[0].price;
      const itemPrice = productPrice * item.quantity;
      totalPrice += itemPrice;

      // Update product supply and add to order_items and product_history
      await db
        .update(products)
        .set({
          supply: product[0].supply - item.quantity,
        })
        .where(eq(products.id, item.productId));

      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: productPrice,
      });

      await db.insert(productHistory).values({
        productId: item.productId,
        type: "departure",
        quantity: item.quantity,
      });
    }

    // Update the total price of the order
    const updatedOrder = await db
      .update(orders)
      .set({ totalPrice })
      .where(eq(orders.id, newOrder.id))
      .returning();

    return NextResponse.json(
      { message: "Order placed successfully!", order: updatedOrder[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to place order:", error);
    return NextResponse.json(
      { error: "Failed to place order. Please check the data." },
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
    const allOrders = await db.query.orders.findMany({
      with: {
        orderItems: true,
      },
    });

    return NextResponse.json(allOrders, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
